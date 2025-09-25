import { type Page, type Locator, expect } from '@playwright/test';

export class NewEpisodePage {
  private readonly page: Page;
  private readonly selectFileButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectFileButton = page.locator('button', { hasText: 'Select a file' });
  }

  async goto(baseUrl: string, podcastId: string) {
    await this.page.goto(
      `${baseUrl}/pod/show/${podcastId}/episode/wizard`
    );
    await this.page.waitForLoadState('networkidle');
  }

  async assertPageIsVisible() {
    await expect(this.selectFileButton).toBeVisible();
  }
}
