import { Page } from '@playwright/test';

export class EpisodesPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(baseUrl: string, podcastId: string) {
    await this.page.goto(`${baseUrl}/pod/show/${podcastId}/episodes`);
    // Wait for the main heading to be visible to ensure the page is loaded
    await this.page.getByRole('heading', { name: 'Episodes' }).waitFor();
    // Wait for the network to be idle to ensure dynamic content is loaded
    await this.page.waitForLoadState('networkidle');
  }
}
