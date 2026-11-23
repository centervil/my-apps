import { type Page } from '@playwright/test';
import { QualityCheckResult, performQualityCheck, derivePublishedUrl, extractKeyFromUrl, verifyMagazineAppliedFromApi } from '../features/noteDraftCreator';
import { assertNoteDeletionAllowed } from '../utils/noteWhitelist';
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

    // 1. Explicitly insert template text, Spotify URL paragraph for native editor conversion, and TOC block in correct order:
    // Regular order: intro boilerplate (templateText) -> Spotify URL paragraph (for note editor auto-embed conversion) -> TOC -> Body HTML (no leading empty paragraphs)
    await this.page.evaluate(({ spotifyUrl, templateText, bodyHtml }) => {
      const editor = document.querySelector('.ProseMirror');
      if (!editor) return;

      // Clear editor children if any residual
      editor.innerHTML = '';

      // 1. Insert template text paragraph first
      const templateP = document.createElement('p');
      templateP.textContent = templateText;
      editor.appendChild(templateP);

      // 2. Insert Spotify URL paragraph second (so note editor converts it into embedded block natively)
      const spotifyP = document.createElement('p');
      spotifyP.textContent = spotifyUrl;
      editor.appendChild(spotifyP);

      // 3. Insert TOC block (table-of-contents) third
      const tocNode = document.createElement('table-of-contents');
      tocNode.setAttribute('data-block-type', 'toc');
      tocNode.setAttribute('contenteditable', 'false');
      tocNode.textContent = '目次';
      editor.appendChild(tocNode);

      // 4. Insert body HTML via temporary container fourth
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = bodyHtml;
      while (tempDiv.firstChild) {
        editor.appendChild(tempDiv.firstChild);
      }
    }, { spotifyUrl, templateText, bodyHtml });

    // Wait for editor native conversion of Spotify URL paragraph to embed block
    console.log('Waiting for editor to convert Spotify URL into embedded block...');
    let converted = false;
    for (let attempt = 1; attempt <= 10; attempt++) {
      await this.page.waitForTimeout(1000);
      // Focus editor and trigger keypress to help editor conversion pipeline
      await editor.click();
      await this.page.keyboard.press('Space');
      await this.page.keyboard.press('Backspace');

      converted = await this.page.evaluate(() => {
        const ed = document.querySelector('.ProseMirror');
        if (!ed) return false;
        // Check if figure with embed-service or data-block-type="embed" or iframe exists
        const figure = ed.querySelector('figure[data-block-type="embed"], figure.o-noteEmbedCard, figure, iframe[src*="spotify.com"]');
        return figure !== null;
      });

      if (converted) {
        console.log(`✅ Spotify embed block successfully detected in editor at attempt ${attempt}.`);
        break;
      }
    }

    if (!converted) {
      throw new Error('Explicit Spotify embed conversion timeout: Note editor failed to convert Spotify URL paragraph into an embed block within timeout. Aborting without fallback.');
    }
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

      // Block order check: intro boilerplate, Spotify embed, and TOC must appear before the first heading (h2 / h3), and template text should be first.
      const allChildren = Array.from(editor.children);
      let firstHeadingIndex = -1;
      let spotifyIndex = -1;
      let tocIndex = -1;
      let templateIndex = -1;

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
        const isTemplate = txt.includes('この記事の内容はPodCastとしても配信しています');
        if (isTemplate && templateIndex === -1) {
          templateIndex = index;
        }
      });

      console.log('Block order debug indices:', { firstHeadingIndex, spotifyIndex, tocIndex, templateIndex, childrenCount: allChildren.length });

      const blockOrderValid = (templateIndex === 0 || templateIndex === -1) &&
        (firstHeadingIndex === -1 || ((spotifyIndex === -1 || spotifyIndex < firstHeadingIndex) && (tocIndex === -1 || tocIndex < firstHeadingIndex)));

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

      // 1. Click the circular icon button in top area (main > div button[data-id="ButtonIcon"])
      const iconButtonSelector = 'main > div button[data-id="ButtonIcon"], main > div button, button[aria-label*="ヘッダー"], .note-eyecatch button, button:has-text("ヘッダー画像")';
      const iconBtn = this.page.locator(iconButtonSelector).first();
      await iconBtn.waitFor({ state: 'visible', timeout: 10000 });
      await iconBtn.click();
      await this.page.waitForTimeout(1000);

      // 2. Click "画像をアップロード" button via normal click (not JS click)
      const uploadMenuItem = this.page.locator('button:has-text("画像をアップロード"), [role="menuitem"]:has-text("画像をアップロード")').first();
      await uploadMenuItem.waitFor({ state: 'visible', timeout: 10000 });
      await uploadMenuItem.click();
      await this.page.waitForTimeout(1000);

      // 3. Set files on input[type="file"]
      const fileInputSelector = 'input[type="file"]';
      const fileInput = this.page.locator(fileInputSelector).first();
      await fileInput.setInputFiles(tmpFilePath);
      await this.page.waitForTimeout(2000);

      // 4. CropModal ("画像のサイズの変更") - click "保存"
      const saveCropBtn = this.page.locator('button:has-text("保存"), button:has-text("切り取り")').filter({ hasText: /^保存$|^決定$|^適用$/ }).first();
      if (await saveCropBtn.count() > 0 && await saveCropBtn.isVisible()) {
        await saveCropBtn.click();
        await this.page.waitForTimeout(2000);
      } else {
        // Fallback: click primary button in modal
        const modalPrimaryBtn = this.page.locator('.ReactModal__Content button.o-button--primary, [role="dialog"] button.o-button--primary, [role="dialog"] button:has-text("保存")').first();
        if (await modalPrimaryBtn.count() > 0 && await modalPrimaryBtn.isVisible()) {
          await modalPrimaryBtn.click();
          await this.page.waitForTimeout(2000);
        }
      }

      // 5. Click "一時保存" to confirm/save draft state
      const draftBtn = this.page.locator('button:has-text("一時保存"), button:has-text("下書き保存")').first();
      if (await draftBtn.count() > 0 && await draftBtn.isVisible()) {
        await draftBtn.click();
        await this.page.waitForTimeout(2000);
      }

      return { success: true };
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
    // Whitelist check MUST occur before ANY page navigation or API call (fail-closed)
    assertNoteDeletionAllowed(noteId);

    try {
      console.log(`Attempting to delete noteId: ${noteId}...`);

      // 1. First, check if the note is published or a draft via API (GET https://note.com/api/v3/notes/<noteId>)
      let isPublished = false;
      try {
        const apiResponse = await this.page.request.get(`https://note.com/api/v3/notes/${noteId}`);
        if (apiResponse.ok()) {
          const apiData = await apiResponse.json();
          const status = apiData?.data?.status || apiData?.status;
          isPublished = status === 'published';
          console.log(`Note API status check for ${noteId}: status = ${status}, isPublished = ${isPublished}`);
        }
      } catch (err) {
        console.log('Failed to fetch note status via API before deletion, defaulting to draft flow:', err);
      }

      if (isPublished) {
        // Flow A: Published article deletion via https://note.com/notes list page
        console.log(`Note ${noteId} is published. Navigating to https://note.com/notes to delete via list...`);
        await this.page.goto('https://note.com/notes');
        await this.page.waitForURL(/.*note\.com\/notes.*/, { timeout: 30000 });
        await this.page.waitForTimeout(3000);

        // Find row containing noteId strictly via anchor tag href
        const link = this.page.locator(`a[href*="${noteId}"]`);
        if (await link.count() !== 1) {
          console.error(`Cannot uniquely identify note link for noteId ${noteId}. Found ${await link.count()} matches. Aborting deletion.`);
          return false;
        }

        const row = link.locator('xpath=ancestor::*[contains(@class, "ListItem") or contains(@class, "note") or self::tr or self::li]').first();
        if (await row.count() === 0) {
          console.error(`Cannot find ancestor row for noteId ${noteId}. Aborting deletion.`);
          return false;
        }

        const menuBtn = row.locator('button').last();
        if (await menuBtn.count() === 0) {
          console.error(`Cannot find menu button inside row for noteId ${noteId}. Aborting deletion.`);
          return false;
        }

        await menuBtn.click({ force: true });
        await this.page.waitForTimeout(1000);

        // Scope deletion item specifically to displayed menu
        const menuContainer = this.page.locator('[role="menu"], [data-radix-popper-content-wrapper], .o-dropdownMenu, [class*="menu"]').filter({ hasText: '削除' });
        if (await menuContainer.count() === 0) {
          console.error('Menu container with "削除" option was not found after clicking menu button. Aborting deletion.');
          return false;
        }

        const deleteItem = menuContainer.locator('button, [role="menuitem"]').filter({ hasText: '削除' });
        if (await deleteItem.count() !== 1 || !await deleteItem.isVisible()) {
          console.error(`Cannot uniquely identify visible delete item in menu. Found ${await deleteItem.count()} items. Aborting deletion.`);
          return false;
        }

        await deleteItem.click({ force: true });
        await this.page.waitForTimeout(1000);

        // Scope confirmation button specifically to displayed dialog
        const dialogContainer = this.page.locator('[role="dialog"], [role="alertdialog"], .o-modal, [class*="dialog"]').filter({ hasText: '削除' });
        if (await dialogContainer.count() === 0) {
          console.error('Confirmation dialog with "削除" was not found. Aborting deletion.');
          return false;
        }

        const confirmBtn = dialogContainer.locator('button').filter({ hasText: /削除する|削除/ });
        if (await confirmBtn.count() !== 1 || !await confirmBtn.isVisible()) {
          console.error(`Cannot uniquely identify confirm button in dialog. Found ${await confirmBtn.count()} buttons. Aborting deletion.`);
          return false;
        }

        await confirmBtn.click({ force: true });
        await this.page.waitForTimeout(3000);
        console.log(`Successfully deleted published note ${noteId} via scoped anchor row.`);
        return true;

      } else {
        // Flow B: Draft article deletion via editor (https://editor.note.com/notes/<key>/edit/)
        console.log(`Note ${noteId} is a draft. Navigating to editor: https://editor.note.com/notes/${noteId}/edit`);
        await this.page.goto(`https://editor.note.com/notes/${noteId}/edit`);
        await this.page.waitForURL(/\/notes\/[a-zA-Z0-9_\-]+\/edit\/?.*/, { timeout: 30000 });
        await this.page.waitForTimeout(3000);

        // Click "その他" menu in editor header (button[aria-label="その他"])
        const otherMenuBtn = this.page.locator('button[aria-label="その他"], button[aria-label*="その他"], button:has-text("その他")').first();
        if (await otherMenuBtn.count() === 0 || !await otherMenuBtn.isVisible()) {
          console.error('Editor header "その他" menu button not found. Aborting deletion.');
          return false;
        }

        await otherMenuBtn.click({ force: true });
        await this.page.waitForTimeout(1000);

        const editorMenu = this.page.locator('[role="menu"], [data-radix-popper-content-wrapper], .o-dropdownMenu, [class*="menu"]').filter({ hasText: '削除' });
        if (await editorMenu.count() === 0) {
          console.error('Editor dropdown menu containing "削除" not found. Aborting deletion.');
          return false;
        }

        const deleteOption = editorMenu.locator('button, [role="menuitem"]').filter({ hasText: '削除' });
        if (await deleteOption.count() !== 1 || !await deleteOption.isVisible()) {
          console.error(`Cannot uniquely identify delete option in editor menu. Found ${await deleteOption.count()} options. Aborting deletion.`);
          return false;
        }

        await deleteOption.click({ force: true });
        await this.page.waitForTimeout(1000);

        const dialogContainer = this.page.locator('[role="dialog"], [role="alertdialog"], .o-modal, [class*="dialog"]').filter({ hasText: '削除' });
        if (await dialogContainer.count() === 0) {
          console.error('Confirmation dialog with "削除" was not found in editor. Aborting deletion.');
          return false;
        }

        const confirmBtn = dialogContainer.locator('button').filter({ hasText: /削除する|削除/ });
        if (await confirmBtn.count() !== 1 || !await confirmBtn.isVisible()) {
          console.error(`Cannot uniquely identify confirm button in editor dialog. Found ${await confirmBtn.count()} buttons. Aborting deletion.`);
          return false;
        }

        await confirmBtn.click({ force: true });
        await this.page.waitForTimeout(3000);
        console.log(`Successfully deleted draft note ${noteId} via editor.`);
        return true;
      }

    } catch (e) {
      if (e instanceof Error && 'code' in e && (e as { code: unknown }).code === 'DELETE_NOT_ALLOWED') {
        throw e;
      }
      console.log('Error deleting note:', e);
    }
    return false;
  }
}
