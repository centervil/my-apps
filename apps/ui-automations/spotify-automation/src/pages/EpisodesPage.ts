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
    // Wait for the loading skeleton to disappear before proceeding
    await this.page
      .locator('.indexstyled__PulsatingLine-sc-15ud9mm-0')
      .first()
      .waitFor({ state: 'hidden', timeout: 15000 });
  }
}
