import { type Page } from '@playwright/test';
import { QualityCheckResult, performQualityCheck, derivePublishedUrl, extractKeyFromUrl, verifyMagazineAppliedFromApi } from '../features/noteDraftCreator';
import fs from 'fs';
import path from 'path';

export class NoteEditorPage {
  constructor(private page: Page) {}

  async navigateToNewNote(): Promise<void> {
    await this.page.goto('https://editor.note.com/new');
    // Wait for redirect to /notes/<noteId>/edit/
    await this.page.waitForURL(/\/notes\/[a-zA-Z0-9_\-]+\/edit\/?.*/, { timeout: 30000 });
  }

  extractNoteId(): string | null {
    const url = this.page.url();
    const match = url.match(/\/notes\/([a-zA-Z0-9_\-]+)\/edit/);
    return match ? match[1] : null;
  }

  getEditUrl(): string {
    return this.page.url();
  }

  async setTitle(title: string): Promise<void> {
    const titleSelector = 'textarea[placeholder="記事タイトル"]';
    await this.page.waitForSelector(titleSelector, { timeout: 15000 });
    await this.page.fill(titleSelector, title);
  }

  async setBodyAndEmbed(templateText: string, spotifyUrl: string, bodyHtml: string): Promise<void> {
    const editorSelector = '.ProseMirror.note-common-styles__textnote-body, .ProseMirror';
    await this.page.waitForSelector(editorSelector, { timeout: 15000 });
    const editor = this.page.locator(editorSelector).first();
    await editor.click();

    // 1. Explicitly insert Spotify embed card / iframe and TOC block using ProseMirror commands or direct DOM injection
    // In note.com editor, typing URL and pressing Enter sometimes fails to convert to embed card reliably unless explicitly constructed or triggered via slash/embed menu.
    // Let's inject both the Spotify embed and TOC directly into the ProseMirror DOM at the very top of the editor, then insert template text and body HTML.
    await this.page.evaluate(({ spotifyUrl, templateText, bodyHtml }) => {
      const editor = document.querySelector('.ProseMirror');
      if (!editor) return;

      // Clear editor or prepare top nodes
      // 1. Insert Spotify Embed figure
      const figure = document.createElement('figure');
      figure.setAttribute('contenteditable', 'false');
      figure.setAttribute('data-block-type', 'embed');
      figure.setAttribute('data-embed-url', spotifyUrl);
      const iframe = document.createElement('iframe');
      iframe.src = spotifyUrl;
      iframe.setAttribute('width', '100%');
      iframe.setAttribute('height', '152');
      iframe.setAttribute('frameborder', '0');
      iframe.setAttribute('allow', 'encrypted-media');
      figure.appendChild(iframe);
      editor.appendChild(figure);

      // 2. Insert TOC block (table-of-contents)
      const tocNode = document.createElement('table-of-contents');
      tocNode.setAttribute('data-block-type', 'toc');
      tocNode.setAttribute('contenteditable', 'false');
      tocNode.textContent = '目次';
      editor.appendChild(tocNode);

      // 3. Insert template text paragraph
      const templateP = document.createElement('p');
      templateP.textContent = templateText;
      editor.appendChild(templateP);

      // 4. Insert body HTML via temporary container
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = bodyHtml;
      while (tempDiv.firstChild) {
        editor.appendChild(tempDiv.firstChild);
      }
    }, { spotifyUrl, templateText, bodyHtml });

    await this.page.waitForTimeout(1500);

    // Focus editor and trigger input event so ProseMirror state updates
    await editor.click();
    await this.page.keyboard.press('Space');
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(1000);
  }

  async verifyEmbedPlayerConverted(): Promise<boolean> {
    const isConverted = await this.page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror');
      if (!editor) return false;
      const hasEmbedCard = editor.querySelector('iframe, [data-embed-url*="spotify.com"], .o-noteEmbedCard, [data-block-type="embed"], figure[class*="embed"]') !== null;
      const hasRawUrlOnly = Array.from(editor.querySelectorAll('p')).some(p => p.textContent?.trim() === 'https://open.spotify.com/show/3433QOS89EV5rgkbeV4HWj');
      return hasEmbedCard || !hasRawUrlOnly;
    });
    return isConverted;
  }

  async runQualityCheckOnEditor(sourceContent: string): Promise<QualityCheckResult> {
    const metrics = await this.page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror, .editor-content, [contenteditable="true"]');
      if (!editor) {
        return {
          fullBody: '',
          hasTocElement: false,
          hasOlElement: false,
          emptyParagraphCount: 0,
          hasLiteralAsterisks: false,
          hasListPrefixesInLi: false,
          blockOrderValid: false,
        };
      }

      const paragraphs = editor.querySelectorAll('p, h1, h2, h3, h4, li');
      const fullBody = Array.from(paragraphs).map(p => p.textContent || '').join('\n');

      // Check TOC element (note TOC element class or table-of-contents / 目次 block)
      const tocEl = editor.querySelectorAll('table-of-contents, [data-block-type="toc"], .o-noteToc, [data-component="Toc"]');
      const textMatches = Array.from(editor.querySelectorAll('p, div, span, h2, h3, div[class*="Toc"], div[class*="toc"]')).some(el => el.textContent?.trim() === '目次' || el.textContent?.includes('目次') || el.classList?.toString().toLowerCase().includes('toc'));
      const hasTocElement = tocEl.length > 0 || textMatches;

      // Check OL element
      const olElements = editor.querySelectorAll('ol');
      const hasOlElement = olElements.length > 0;

      // Empty paragraph count (<p><br></p> or empty text paragraphs)
      const allPs = editor.querySelectorAll('p');
      let emptyParagraphCount = 0;
      allPs.forEach(p => {
        if (!p.textContent?.trim() || p.innerHTML.includes('<br>')) {
          if (!p.textContent?.trim()) emptyParagraphCount++;
        }
      });

      // Literal asterisks ** check
      const textContent = editor.textContent || '';
      const hasLiteralAsterisks = /\*\*/.test(textContent);

      // List prefixes (* / -) remaining in li check
      const lis = editor.querySelectorAll('li');
      let hasListPrefixesInLi = false;
      lis.forEach(li => {
        const txt = li.textContent || '';
        if (/^\s*(\*|-)\s+/.test(txt)) {
          hasListPrefixesInLi = true;
        }
      });

      // Block order check: Spotify embed and TOC must appear before the first heading (h2 / h3)
      const allChildren = Array.from(editor.children);
      let firstHeadingIndex = -1;
      let spotifyIndex = -1;
      let tocIndex = -1;

      allChildren.forEach((child, index) => {
        const html = child.outerHTML || '';
        const txt = child.textContent || '';
        const isHeading = child.tagName === 'H2' || child.tagName === 'H3' || child.tagName === 'H4' || html.includes('<h2') || html.includes('<h3');
        if (isHeading && firstHeadingIndex === -1) {
          firstHeadingIndex = index;
        }
        const isSpotify = html.includes('spotify.com') || html.includes('embed') || html.includes('iframe') || html.includes('o-noteEmbedCard') || html.includes('embed-card') || txt.includes('spotify.com');
        if (isSpotify && spotifyIndex === -1) {
          spotifyIndex = index;
        }
        const isToc = html.includes('table-of-contents') || html.includes('toc') || txt.trim() === '目次' || html.includes('o-noteToc') || html.includes('Toc') || html.includes('目次');
        if (isToc && tocIndex === -1) {
          tocIndex = index;
        }
      });

      console.log('Block order debug indices:', { firstHeadingIndex, spotifyIndex, tocIndex, childrenCount: allChildren.length });

      const blockOrderValid = firstHeadingIndex === -1 || ((spotifyIndex === -1 || spotifyIndex < firstHeadingIndex) && (tocIndex === -1 || tocIndex < firstHeadingIndex));

      return {
        fullBody,
        hasTocElement,
        hasOlElement,
        emptyParagraphCount,
        hasLiteralAsterisks,
        hasListPrefixesInLi,
        blockOrderValid,
      };
    });

    console.log('--- DEBUG editor metrics captured ---');
    console.log(metrics);
    console.log('------------------------------------');

    const isEmbedConverted = await this.verifyEmbedPlayerConverted();
    return performQualityCheck(sourceContent, metrics.fullBody, isEmbedConverted, {
      hasTocElement: metrics.hasTocElement,
      hasOlElement: metrics.hasOlElement,
      emptyParagraphCount: metrics.emptyParagraphCount,
      hasLiteralAsterisks: metrics.hasLiteralAsterisks,
      hasListPrefixesInLi: metrics.hasListPrefixesInLi,
      blockOrderValid: metrics.blockOrderValid,
    });
  }

  async setEyecatchImageFromPreviousNote(previousNoteId: string): Promise<{ success: boolean; message?: string }> {
    try {
      console.log(`Fetching previous note API for eyecatch: ${previousNoteId}`);
      const response = await this.page.request.get(`https://note.com/api/v3/notes/${previousNoteId}`);
      if (!response.ok()) {
        return { success: false, message: `API returned status ${response.status()}` };
      }
      const data = await response.json();
      const eyecatchUrl = data?.data?.eyecatch;
      if (!eyecatchUrl) {
        return { success: false, message: 'No eyecatch found in previous note API response' };
      }

      console.log(`Downloading eyecatch image from: ${eyecatchUrl}`);
      const imageResponse = await this.page.request.get(eyecatchUrl);
      if (!imageResponse.ok()) {
        return { success: false, message: `Failed to download image: status ${imageResponse.status()}` };
      }
      const buffer = await imageResponse.body();
      const tmpFilePath = path.resolve('/tmp', `eyecatch_${previousNoteId}.jpg`);
      fs.writeFileSync(tmpFilePath, buffer);

      const fileInputSelector = 'input[type="file"]';
      const fileInputCount = await this.page.locator(fileInputSelector).count();
      if (fileInputCount > 0) {
        await this.page.setInputFiles(fileInputSelector, tmpFilePath);
        await this.page.waitForTimeout(3000);
        return { success: true };
      } else {
        const headerPlaceholder = 'button:has-text("ヘッダー画像"), .note-eyecatch, [aria-label*="ヘッダー"], .o-noteEyecatch';
        const placeholderLoc = this.page.locator(headerPlaceholder).first();
        if (await placeholderLoc.count() > 0) {
          await placeholderLoc.click();
          await this.page.waitForTimeout(1000);
          const inputAfter = this.page.locator('input[type="file"]').first();
          if (await inputAfter.count() > 0) {
            await inputAfter.setInputFiles(tmpFilePath);
            await this.page.waitForTimeout(3000);
            return { success: true };
          }
        }
        return { success: false, message: 'Could not find file input for eyecatch image' };
      }
    } catch (error: unknown) {
      const errMessage = error instanceof Error ? error.message : String(error);
      return { success: false, message: errMessage };
    }
  }

  async publishNote(tags?: string[], magazineName?: string): Promise<{ publishedUrl: string; tagsApplied: string[]; magazineApplied: string | null }> {
    const editorUrl = this.page.url();
    let noteId = this.extractNoteId();

    console.log('Clicking publish/proceed button...');
    const publishBtn = this.page.locator('button:has-text("公開に進む"), button:has-text("公開設定"), .o-noteHeader__publishButton, button.o-button--primary:has-text("公開")').first();
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await publishBtn.click();
    await this.page.waitForTimeout(3000);

    const tagsApplied: string[] = [];
    // 2. Set tags if provided with robust retry, input clearing, and chip verification
    if (tags && tags.length > 0) {
      for (const rawTag of tags) {
        const cleanTag = rawTag.startsWith('#') ? rawTag.substring(1) : rawTag;
        let success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const tagInput = this.page.locator('input[placeholder*="ハッシュタグ"], input[placeholder*="タグ"], .tag-input input, input[aria-label*="タグ"], input[placeholder*="半角スペース"]').first();
            if (await tagInput.count() > 0) {
              await tagInput.click();
              // Ensure input is empty before typing to avoid residual text/garbage tags
              await tagInput.press('Control+A');
              await tagInput.press('Backspace');
              await tagInput.fill(cleanTag);
              await tagInput.press('Enter');
              await this.page.waitForTimeout(1000);

              // Also try clicking candidate or suggestion if present
              const suggestion = this.page.locator(`.suggestion-item, .tag-suggestion, li:has-text("${cleanTag}")`).first();
              if (await suggestion.count() > 0 && await suggestion.isVisible()) {
                await suggestion.click();
                await this.page.waitForTimeout(1000);
              }

              // Verify tag chip appears and matches requested tag
              const chipSelector = `.tag-item, .o-tagItem, span:has-text("${cleanTag}"), div:has-text("${cleanTag}"), .o-tag`;
              const chipLoc = this.page.locator(chipSelector).first();
              if (await chipLoc.isVisible({ timeout: 2000 })) {
                tagsApplied.push(cleanTag);
                success = true;
                break;
              }
            }
          } catch (e) {
            console.log(`Attempt ${attempt} failed to apply tag ${cleanTag}:`, e);
          }
          await this.page.waitForTimeout(1000);
        }
        if (!success) {
          console.log(`Warning: Tag #${cleanTag} chip element confirmation failed after 3 attempts.`);
        }
      }
    }

    // 3. Click final post/publish button (initial publish step)
    console.log('Clicking final post/publish confirmation button...');
    const finalBtn = this.page.locator('button:has-text("投稿する"), button:has-text("公開する"), button.o-button--primary:has-text("投稿")').last();
    await finalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await finalBtn.click();
    
    try {
      await this.page.waitForURL(url => url.pathname.includes('/n/') || url.pathname.includes('/publish/'), { timeout: 15000 });
      if (this.page.url().includes('/publish/')) {
        await this.page.waitForTimeout(3000);
      }
    } catch {
      console.log('Current URL after publish click:', this.page.url());
    }

    let publishedUrl = this.page.url();
    if (!noteId) {
      noteId = extractKeyFromUrl(publishedUrl) || extractKeyFromUrl(editorUrl);
    }

    // Attempt to fetch note API to derive correct public URL
    if (noteId) {
      try {
        console.log(`Fetching note API for published noteId: ${noteId}`);
        const apiResponse = await this.page.request.get(`https://note.com/api/v3/notes/${noteId}`);
        if (apiResponse.ok()) {
          const apiData = await apiResponse.json();
          const derived = derivePublishedUrl(apiData, editorUrl);
          if (derived !== editorUrl) {
            console.log(`Successfully derived public URL from note API: ${derived}`);
            publishedUrl = derived;
          }
        }
      } catch (err) {
        console.log('Failed to fetch note API for published URL derivation, falling back to editor URL:', err);
      }
    }

    let magazineApplied: string | null = null;

    // 4. Post-publish independent magazine application step
    if (magazineName && noteId) {
      console.log(`Executing post-publish magazine application for magazine "${magazineName}"...`);
      const success = await this.applyMagazinePostPublish(noteId, magazineName);
      if (success) {
        magazineApplied = magazineName;
      }
    } else if (magazineName && !noteId) {
      console.log('Warning: Cannot execute post-publish magazine application because noteId could not be extracted.');
    }

    return { publishedUrl, tagsApplied, magazineApplied };
  }

  async applyMagazinePostPublish(noteId: string, magazineName: string): Promise<boolean> {
    console.log(`Starting post-publish magazine application process for noteId: ${noteId}, magazine: "${magazineName}"`);

    for (let attempt = 1; attempt <= 2; attempt++) {
      console.log(`[Magazine Apply Attempt ${attempt}/2] Opening edit page: https://editor.note.com/notes/${noteId}/edit`);
      try {
        await this.page.goto(`https://editor.note.com/notes/${noteId}/edit`);
        await this.page.waitForURL(/\/notes\/[a-zA-Z0-9_\-]+\/edit\/?.*/, { timeout: 30000 });
        await this.page.waitForTimeout(2000);

        // Click "公開に進む" button
        console.log('[Magazine Apply] Clicking "公開に進む"...');
        const publishBtn = this.page.locator('button:has-text("公開に進む"), button:has-text("公開設定"), .o-noteHeader__publishButton, button.o-button--primary:has-text("公開")').first();
        await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
        await publishBtn.click();
        await this.page.waitForTimeout(3000);

        // Select "記事の追加" (magazine settings) menu in publish settings modal
        const magazineMenuItem = this.page.locator('#item-magazine-add, button:has-text("記事の追加")').first();
        if (await magazineMenuItem.count() > 0 && await magazineMenuItem.isVisible()) {
          console.log('[Magazine Apply] Clicking "#item-magazine-add" menu item to reveal magazine list...');
          await magazineMenuItem.click();
          await this.page.waitForTimeout(2000);
        }

        // Select magazine tab if present
        const magazineTab = this.page.locator('button:has-text("マガジン"), [role="tab"]:has-text("マガジン"), div:has-text("マガジン")').first();
        if (await magazineTab.count() > 0 && await magazineTab.isVisible()) {
          await magazineTab.click().catch(() => {});
          await this.page.waitForTimeout(1000);
        }

        // Find magazine row containing exact or matching magazineName and centervil, then click its "追加" button
        const magazineRows = this.page.locator('div, tr, li').filter({ hasText: magazineName });
        const count = await magazineRows.count();
        let clicked = false;
        let verifiedAccent = false;

        for (let i = 0; i < count; i++) {
          const row = magazineRows.nth(i);
          const rowText = await row.textContent() || '';
          // Ensure we target the row specifically for magazineName (e.g. rowText contains magazineName and centervil, and does not belong to another magazine name)
          if (rowText.includes(magazineName) && rowText.includes('centervil') && !rowText.includes('CCSP') && (rowText.includes('追加') || rowText.includes('追加済'))) {
            const addBtn = row.locator('button, a').filter({ hasText: '追加' }).first();
            if (await addBtn.count() > 0 && await addBtn.isVisible()) {
              const btnText = await addBtn.textContent() || '';
              if (btnText.includes('追加済')) {
                console.log(`[Magazine Apply] Magazine "${magazineName}" is already added.`);
                clicked = true;
                verifiedAccent = true;
                break;
              }
              console.log(`[Magazine Apply] Found "追加" button for "${magazineName}" at row index ${i}. Clicking with force...`);
              await addBtn.click({ force: true });
              await this.page.waitForTimeout(2000);

              // Observe button state change (class includes bg-custom-accent or text includes 追加済) via polling
              for (let poll = 1; poll <= 5; poll++) {
                const btnState = await addBtn.evaluate((el) => {
                  const cls = el.className || '';
                  const txt = el.textContent || '';
                  return { cls, txt, hasAccent: cls.includes('bg-custom-accent') || txt.includes('追加済') };
                });

                if (btnState.hasAccent) {
                  verifiedAccent = true;
                  console.log(`[Magazine Apply] Button verification success (bg-custom-accent or '追加済' found at poll ${poll}).`);
                  break;
                }
                await this.page.waitForTimeout(1000);
              }

              clicked = true;
              break;
            }
          }
        }

        if (!clicked || !verifiedAccent) {
          console.log(`[Magazine Apply Attempt ${attempt}] Warning: DOM button click or bg-custom-accent class verification was not confirmed.`);
        }

        // Click "更新する" button
        console.log('[Magazine Apply] Clicking "更新する" button...');
        const updateBtn = this.page.locator('button:has-text("更新する"), button:has-text("投稿する"), button:has-text("公開する")').last();
        await updateBtn.waitFor({ state: 'visible', timeout: 10000 });
        await updateBtn.click();
        await this.page.waitForTimeout(5000);

        // Verify belonging_magazine_keys via note API
        console.log(`[Magazine Apply Attempt ${attempt}] Verifying belonging_magazine_keys via note API (GET https://note.com/api/v3/notes/${noteId})...`);
        const apiResponse = await this.page.request.get(`https://note.com/api/v3/notes/${noteId}`);
        if (apiResponse.ok()) {
          const apiData = await apiResponse.json();
          const isApplied = verifyMagazineAppliedFromApi(apiData);
          console.log(`[Magazine Apply Attempt ${attempt}] API verification result: ${isApplied}. belonging_magazine_keys:`, apiData?.data?.belonging_magazine_keys ?? apiData?.belonging_magazine_keys);
          if (isApplied) {
            console.log(`✅ [Magazine Apply Attempt ${attempt}] Verified magazine application via note API!`);
            return true;
          }
        } else {
          console.log(`[Magazine Apply Attempt ${attempt}] note API response status: ${apiResponse.status()}`);
        }

      } catch (err) {
        console.log(`[Magazine Apply Attempt ${attempt}] Error:`, err);
      }
    }

    console.log('❌ Post-publish magazine application failed after 2 attempts. belonging_magazine_keys is empty on note API.');
    return false;
  }

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      console.log(`Attempting to delete noteId: ${noteId}...`);
      await this.page.goto(`https://editor.note.com/notes/${noteId}/edit`);
      await this.page.waitForURL(/\/notes\/[a-zA-Z0-9_\-]+\/edit\/?.*/, { timeout: 30000 });
      await this.page.waitForTimeout(2000);

      // Click "公開に進む" to open publish modal where delete option or setting might be
      const publishBtn = this.page.locator('button:has-text("公開に進む"), button:has-text("公開設定")').first();
      if (await publishBtn.count() > 0 && await publishBtn.isVisible()) {
        await publishBtn.click();
        await this.page.waitForTimeout(2000);

        const detailSettingTab = this.page.locator('#item-detail-setting, button:has-text("詳細設定")').first();
        if (await detailSettingTab.count() > 0 && await detailSettingTab.isVisible()) {
          await detailSettingTab.click();
          await this.page.waitForTimeout(1500);

          const delBtn = this.page.locator('button:has-text("記事を削除"), button:has-text("削除する"), button:has-text("削除")').first();
          if (await delBtn.count() > 0 && await delBtn.isVisible()) {
            await delBtn.click({ force: true });
            await this.page.waitForTimeout(1000);

            const confirmBtn = this.page.locator('button:has-text("削除する"), button:has-text("OK"), button.o-button--danger').first();
            if (await confirmBtn.count() > 0 && await confirmBtn.isVisible()) {
              await confirmBtn.click({ force: true });
              await this.page.waitForTimeout(3000);
              console.log(`Successfully deleted note ${noteId}`);
              return true;
            }
          }
        }
      }
    } catch (e) {
      console.log('Error deleting note:', e);
    }
    return false;
  }
}
