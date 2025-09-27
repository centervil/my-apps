import { type Page, type Locator, expect } from '@playwright/test';

export class NewEpisodePage {
  private readonly page: Page;
  private readonly selectFileButton: Locator;
  private readonly fileInput: Locator;
  private readonly titleInput: Locator;
  private readonly descriptionInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectFileButton = page.locator('button', { hasText: 'Select a file' });
    this.fileInput = page.locator('input[type="file"]');
    this.titleInput = page.getByRole('textbox', { name: 'Title (required)' });
    this.descriptionInput = page.locator('[role="textbox"][name="description"]');
  }

  async goto(baseUrl: string, podcastId: string) {
    await this.page.goto(
      `${baseUrl}/pod/show/${podcastId}/episode/wizard`
    );
  }

  async assertPageIsVisible() {
    await expect(this.selectFileButton).toBeVisible();
  }

  async uploadAudioFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  async assertFileUploaded(fileName: string) {
    const fileLocator = this.page.locator(`text=${fileName}`);
    await expect(fileLocator).toBeVisible();
  }

  async fillEpisodeDetails(details: { title: string; description: string }) {
    await this.titleInput.fill(details.title);
    await this.descriptionInput.fill(details.description);
  }

  async assertEpisodeDetails(details: { title: string; description: string }) {
    await expect(this.titleInput).toHaveValue(details.title);
    await expect(this.descriptionInput).toHaveText(details.description);
  }
}
