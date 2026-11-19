import { type Page } from '@playwright/test';
import { QualityCheckResult, performQualityCheck } from '../features/noteDraftCreator';

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
}
