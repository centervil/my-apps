import { type Page } from '@playwright/test';
import { QualityCheckResult, performQualityCheck } from '../features/noteDraftCreator';

export class NoteEditorPage {
  constructor(private page: Page) {}

  async navigateToNewNote(): Promise<void> {
    await this.page.goto('https://note.com/notes/new');
  }

  async setTitle(title: string): Promise<void> {
    // Note editor title selector typical in note.com
    await this.page.fill('textarea[placeholder="タイトル"]', title);
  }

  async setBodyAndEmbed(templateText: string, spotifyUrl: string, bodyContent: string): Promise<void> {
    // Type template text
    await this.page.keyboard.type(templateText);
    await this.page.keyboard.press('Enter');

    // Type Spotify URL and convert to embed player
    await this.page.keyboard.type(spotifyUrl);
    await this.page.keyboard.press('Enter');
    // Wait for embed conversion widget or action
    await this.page.waitForTimeout(1000);

    // Type TOC and body
    await this.page.keyboard.type('目次');
    await this.page.keyboard.press('Enter');
    await this.page.keyboard.type(bodyContent);
  }

  async verifyEmbedPlayerConverted(): Promise<boolean> {
    // Check if iframe or spotify embed player element is present in note editor DOM
    const embedSelector = 'iframe[src*="spotify.com"], .embed-card, figure.embed';
    const count = await this.page.locator(embedSelector).count();
    return count > 0;
  }

  async runQualityCheckOnEditor(sourceContent: string): Promise<QualityCheckResult> {
    const fullBody = await this.page.evaluate(() => {
      // Extract text content or innerHTML from editor
      const editor = document.querySelector('.editor-content, [contenteditable="true"]');
      return editor ? editor.textContent || '' : '';
    });

    const isEmbedConverted = await this.verifyEmbedPlayerConverted();
    return performQualityCheck(sourceContent, fullBody, isEmbedConverted);
  }
}
