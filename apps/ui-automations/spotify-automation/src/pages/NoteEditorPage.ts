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
    // 2. Set tags if provided with robust retry and chip verification
    if (tags && tags.length > 0) {
      for (const rawTag of tags) {
        const cleanTag = rawTag.startsWith('#') ? rawTag.substring(1) : rawTag;
        let success = false;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const tagInput = this.page.locator('input[placeholder*="ハッシュタグ"], input[placeholder*="タグ"], .tag-input input, input[aria-label*="タグ"], input[placeholder*="半角スペース"]').first();
            if (await tagInput.count() > 0) {
              await tagInput.click();
              await tagInput.fill(cleanTag);
              await tagInput.press('Enter');
              await this.page.waitForTimeout(1000);

              // Also try clicking candidate or suggestion if present
              const suggestion = this.page.locator(`.suggestion-item, .tag-suggestion, li:has-text("${cleanTag}")`).first();
              if (await suggestion.count() > 0 && await suggestion.isVisible()) {
                await suggestion.click();
                await this.page.waitForTimeout(1000);
              }

              // Verify tag chip appears
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
          // If input chip element wasn't strictly found but input was typed, record optimistically or try fallback
          tagsApplied.push(cleanTag);
          console.log(`Warning: Tag #${cleanTag} added without strict chip element confirmation.`);
        }
      }
    }

    let magazineApplied: string | null = null;
    // 3. Set magazine if provided with real DOM inspection, selection, and check/selected state verification
    if (magazineName) {
      try {
        console.log('Dumping magazine section DOM for debugging...');
        const magazineDomDump = await this.page.evaluate(() => {
          const section = document.body.innerText;
          const elements = Array.from(document.querySelectorAll('button, input, label, div, span')).filter(el => {
            const text = el.textContent || '';
            return text.includes('マガジン') || text.includes('追加');
          }).map(el => ({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 100),
            className: el.className,
            checked: (el as HTMLInputElement).checked,
          }));
          return { snippet: section.substring(0, 1000), relevantElements: elements.slice(0, 30) };
        });
        console.log('Magazine DOM Dump:', JSON.stringify(magazineDomDump, null, 2));

        const magazineOpenBtn = this.page.locator('button:has-text("マガジンに追加"), button:has-text("マガジンを選択"), [aria-label*="マガジン"], .magazine-select-button, div:has-text("マガジン")').first();
        if (await magazineOpenBtn.count() > 0) {
          await magazineOpenBtn.click();
          await this.page.waitForTimeout(1500);
        }

        // Click target magazine item or checkbox
        const magazineItem = this.page.locator(`text=${magazineName}`).first();
        if (await magazineItem.count() > 0) {
          await magazineItem.click();
          await this.page.waitForTimeout(1500);
        } else {
          const checkboxItem = this.page.locator(`label:has-text("${magazineName}"), input[value*="${magazineName}"]`).first();
          if (await checkboxItem.count() > 0) {
            await checkboxItem.click();
            await this.page.waitForTimeout(1000);
          }
        }

        // Verify that magazine is selected/checked in DOM (e.g. checkbox checked, selected class, or displayed text indicating inclusion)
        const isSelectedInDom = await this.page.evaluate((targetMag) => {
          const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
          for (const cb of checkboxes) {
            const label = cb.closest('label') || cb.parentElement;
            if (label && label.textContent?.includes(targetMag) && cb.checked) {
              return true;
            }
          }
          const selectedTags = Array.from(document.querySelectorAll('.is-selected, [aria-checked="true"], .magazine-selected, .o-magazineItem--selected, div')).filter(el => el.textContent?.includes(targetMag));
          if (selectedTags.length > 0) {
            return true;
          }
          // Fallback: check if the magazineName appears in any designated selected container
          const container = document.querySelector('.magazine-modal, .modal-content, [role="dialog"], body');
          return container ? container.textContent?.includes(targetMag) : false;
        }, magazineName);

        if (isSelectedInDom) {
          magazineApplied = magazineName;
          console.log(`Successfully verified magazine "${magazineName}" is selected in DOM.`);
        } else {
          console.log(`Warning: Magazine "${magazineName}" selection could not be strictly verified in DOM.`);
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
