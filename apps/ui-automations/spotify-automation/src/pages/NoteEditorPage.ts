import { type Page } from '@playwright/test';
import { QualityCheckResult, performQualityCheck, derivePublishedUrl } from '../features/noteDraftCreator';
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

  async setBodyAndEmbed(templateText: string, spotifyUrl: string, bodyContent: string): Promise<void> {
    const editorSelector = '.ProseMirror.note-common-styles__textnote-body, .ProseMirror';
    await this.page.waitForSelector(editorSelector, { timeout: 15000 });
    const editor = this.page.locator(editorSelector).first();
    await editor.click();

    // Type template text
    await this.page.keyboard.type(templateText);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(800);

    // Type Spotify URL and convert to embed player
    await this.page.keyboard.type(spotifyUrl);
    await this.page.keyboard.press('Enter');
    // Wait for embed conversion widget or action (increased timeout for headless/xvfb)
    await this.page.waitForTimeout(7000);

    // Type TOC and body
    await this.page.keyboard.type('目次');
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(1500);

    const paragraphs = bodyContent.split(/\r?\n/);
    for (const p of paragraphs) {
      await this.page.keyboard.type(p);
      await this.page.keyboard.press('Enter');
      await this.page.waitForTimeout(50);
    }
  }

  async verifyEmbedPlayerConverted(): Promise<boolean> {
    const embedSelector = 'iframe[src*="spotify.com"], .embed-card, figure.embed, [data-service="spotify"], .o-noteEmbedCard, a[href*="spotify.com"]';
    const count = await this.page.locator(embedSelector).count();
    return count > 0;
  }

  async runQualityCheckOnEditor(sourceContent: string): Promise<QualityCheckResult> {
    const fullBody = await this.page.evaluate(() => {
      const editor = document.querySelector('.ProseMirror, .editor-content, [contenteditable="true"]');
      if (!editor) return '';
      const paragraphs = editor.querySelectorAll('p, h1, h2, h3, h4, li');
      if (paragraphs.length > 0) {
        return Array.from(paragraphs).map(p => p.textContent || '').join('\n');
      }
      return editor.textContent || '';
    });

    console.log('--- DEBUG fullBody captured from editor ---');
    console.log(fullBody);
    console.log('-------------------------------------------');

    const isEmbedConverted = await this.verifyEmbedPlayerConverted();
    return performQualityCheck(sourceContent, fullBody, isEmbedConverted);
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

      // Locate eyecatch upload input or trigger
      // In note editor, header image can often be set via input[type="file"] or clicking header image area
      const fileInputSelector = 'input[type="file"]';
      const fileInputCount = await this.page.locator(fileInputSelector).count();
      if (fileInputCount > 0) {
        await this.page.setInputFiles(fileInputSelector, tmpFilePath);
        await this.page.waitForTimeout(3000);
        return { success: true };
      } else {
        // Try clicking header image placeholder
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
    const noteId = this.extractNoteId();

    // 1. Click "公開に進む" button or header publish button
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

    let magazineApplied: string | null = null;
    // 3. Set magazine if provided following exact structure: "マガジン / メンバーシップ" tabs -> "<マガジン名> / centervil / 追加" row -> click "追加" button and verify row state change.
    if (magazineName) {
      try {
        console.log('Dumping publishing page DOM for debugging magazine section...');
        const pageDump = await this.page.evaluate(() => {
          return {
            bodyText: document.body.innerText.substring(0, 2000),
            buttons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()).filter(Boolean),
          };
        });
        console.log('Page DOM snippet & buttons:', JSON.stringify(pageDump, null, 2));

        // Locate magazine tab if present ("マガジン" tab or section)
        const magazineTab = this.page.locator('button:has-text("マガジン"), [role="tab"]:has-text("マガジン"), div:has-text("マガジン")').first();
        if (await magazineTab.count() > 0) {
          await magazineTab.click().catch(() => {});
          await this.page.waitForTimeout(1000);
        }

        // Find the target magazine row containing magazineName under "記事の追加" section and click its "追加" button, and verify that button text/class changes or row state changes
        const magazineRows = this.page.locator(`tr, div, li`).filter({ hasText: magazineName });
        const count = await magazineRows.count();
        let clicked = false;
        let verifiedStateChange = false;
        for (let i = 0; i < count; i++) {
          const row = magazineRows.nth(i);
          const rowText = await row.textContent() || '';
          if (rowText.includes('centervil') || rowText.includes('追加')) {
            const addBtn = row.locator('button:has-text("追加"), a:has-text("追加")').first();
            if (await addBtn.count() > 0 && await addBtn.isVisible()) {
              console.log(`Found "追加" button for "${magazineName}" at row index ${i}. Clicking...`);
              await addBtn.click();
              await this.page.waitForTimeout(2500);

               // Observe row state change (e.g. button class includes bg-custom-accent) with polling over a few seconds
               let verifiedAccent = false;
               for (let attempt = 1; attempt <= 5; attempt++) {
                 const stateCheck = await row.evaluate((el) => {
                   const buttons = Array.from(el.querySelectorAll('button, a'));
                   const btnClasses = buttons.map(b => b.className || '');
                   const hasAccent = btnClasses.some(cls => cls.includes('bg-custom-accent'));
                   const btnTexts = buttons.map(b => b.textContent?.trim() || '');
                   return { btnTexts, btnClasses, hasAccent };
                 });

                 console.log(`Row ${i} state check attempt ${attempt}:`, JSON.stringify(stateCheck, null, 2));

                 if (stateCheck.hasAccent) {
                   verifiedAccent = true;
                   break;
                 }
                 await new Promise(r => setTimeout(r, 1000));
               }

               clicked = true;
               if (verifiedAccent) {
                 verifiedStateChange = true;
               }
              break;
            }
          }
        }

        if (clicked && verifiedStateChange) {
          magazineApplied = magazineName;
          console.log(`Successfully applied and verified magazine "${magazineName}" (State change verified: true).`);
        } else {
          console.log(`Warning: Magazine "${magazineName}" application could not be strictly verified via "追加" button state change. magazineApplied remains null.`);
        }
      } catch (e) {
        console.log(`Failed to apply or verify magazine ${magazineName}:`, e);
      }
    }

    // 4. Click final publish/post button
    console.log('Clicking final post/publish confirmation button...');
    const finalBtn = this.page.locator('button:has-text("投稿する"), button:has-text("公開する"), button.o-button--primary:has-text("投稿")').last();
    await finalBtn.waitFor({ state: 'visible', timeout: 10000 });
    await finalBtn.click();
    
    // Wait for actual published public page URL (e.g. /n/n...) or any redirect
    try {
      await this.page.waitForURL(url => url.pathname.includes('/n/') || url.pathname.includes('/publish/'), { timeout: 15000 });
      if (this.page.url().includes('/publish/')) {
        await this.page.waitForTimeout(3000);
      }
    } catch {
      console.log('Current URL after publish click:', this.page.url());
    }

    let publishedUrl = this.page.url();
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

    return { publishedUrl, tagsApplied, magazineApplied };
  }
}
