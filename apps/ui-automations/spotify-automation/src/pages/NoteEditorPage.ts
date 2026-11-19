import { type Page } from '@playwright/test';
import { QualityCheckResult, performQualityCheck } from '../features/noteDraftCreator';
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
    // Wait for embed conversion widget or action
    await this.page.waitForTimeout(4000);

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
    const embedSelector = 'iframe[src*="spotify.com"], .embed-card, figure.embed, [data-service="spotify"], .o-noteEmbedCard';
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

  async publishNote(tags?: string[], magazineName?: string): Promise<string> {
    // 1. Click "公開に進む" button or header publish button
    // Let's inspect/click button with text "公開に進む" or similar
    console.log('Clicking publish/proceed button...');
    const publishBtn = this.page.locator('button:has-text("公開に進む"), button:has-text("公開設定"), .o-noteHeader__publishButton, button.o-button--primary:has-text("公開")').first();
    await publishBtn.waitFor({ state: 'visible', timeout: 10000 });
    await publishBtn.click();
    await this.page.waitForTimeout(3000);

    // 2. Set tags if provided
    if (tags && tags.length > 0) {
      for (const rawTag of tags) {
        const cleanTag = rawTag.startsWith('#') ? rawTag.substring(1) : rawTag;
        const tagInput = this.page.locator('input[placeholder*="ハッシュタグ"], input[placeholder*="タグ"], .tag-input input').first();
        if (await tagInput.count() > 0) {
          await tagInput.fill(cleanTag);
          await tagInput.press('Enter');
          await this.page.waitForTimeout(1000);
        }
      }
    }

    // 3. Set magazine if provided
    if (magazineName) {
      const magazineBtn = this.page.locator(`text=${magazineName}, button:has-text("マガジンを選択")`).first();
      if (await magazineBtn.count() > 0) {
        await magazineBtn.click();
        await this.page.waitForTimeout(1000);
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
      // If we landed on /publish/, wait a bit more or click confirmation if needed
      if (this.page.url().includes('/publish/')) {
        await this.page.waitForTimeout(3000);
      }
    } catch {
      console.log('Current URL after publish click:', this.page.url());
    }
    return this.page.url();
  }
}
