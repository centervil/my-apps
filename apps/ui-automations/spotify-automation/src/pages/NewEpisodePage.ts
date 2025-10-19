import { type Page, type Locator, expect } from '@playwright/test';

export class NewEpisodePage {
  private readonly page: Page;
  private readonly selectFileButton: Locator;
  private readonly titleInput: Locator;
  private readonly descriptionInput: Locator;
  private readonly seasonNumberInput: Locator;
  private readonly episodeNumberInput: Locator;
  private readonly privacyBannerCloseButton: Locator;
  private readonly nextButton: Locator;
  private readonly publishNowOption: Locator;
  private readonly publishButton: Locator;
  private readonly doneButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectFileButton = page.locator('button', {
      hasText: 'Select a file',
    });
    this.titleInput = page.getByRole('textbox', { name: 'Title (required)' });
    this.descriptionInput = page.locator(
      '[role="textbox"][name="description"]',
    );
    this.seasonNumberInput = page.locator('#season-number');
    this.episodeNumberInput = page.locator('#episode-number');
    this.privacyBannerCloseButton = page
      .getByRole('dialog', { name: 'Privacy' })
      .getByLabel('Close');
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.publishNowOption = page.getByText('Now', { exact: true });
    this.publishButton = page.getByRole('button', { name: 'Publish' });
    this.doneButton = page.getByRole('button', { name: 'Done' });
  }

  async goto(baseUrl: string, podcastId: string) {
    await this.page.goto(
      `${baseUrl}/pod/show/${podcastId}/episode/wizard`,
      { timeout: 60000 }, // Increase timeout to 60s
    );
  }

  async assertPageIsVisible() {
    await expect(this.selectFileButton).toBeVisible();
  }

  async uploadAudioFile(filePath: string) {
    // Start waiting for the file chooser before clicking the button
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    // Click the button that opens the file chooser
    await this.selectFileButton.click();
    // Get the file chooser
    const fileChooser = await fileChooserPromise;
    // Set the files
    await fileChooser.setFiles(filePath);
  }

  async assertFileUploaded(fileName: string) {
    const fileLocator = this.page.locator(`text=${fileName}`);
    await expect(fileLocator).toBeVisible();
  }

  async fillEpisodeDetails(details: { title: string; description: string }) {
    await this.titleInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.titleInput.fill(details.title);
    await this.descriptionInput.fill(details.description);
  }

  async assertEpisodeDetails(details: { title: string; description: string }) {
    await expect(this.titleInput).toHaveValue(details.title);
    await expect(this.descriptionInput).toHaveText(details.description);
  }

  async publishEpisode(season: string, episode: string) {
    // Wait for the Next button to be enabled after file upload, indicating processing is done.
    await expect(this.nextButton).toBeEnabled({ timeout: 15000 });

    // Fill in season and episode numbers
    await this.seasonNumberInput.fill(season);
    await this.episodeNumberInput.fill(episode);

    // The privacy banner might obscure the 'Next' button. Close it if it's visible.
    if (await this.privacyBannerCloseButton.isVisible()) {
      await this.privacyBannerCloseButton.click();
    }

    // Proceed to the next step in the wizard
    await this.nextButton.click();

    // On the next screen, select to publish immediately
    await this.publishNowOption.click();

    // Add a small strategic delay to wait for UI updates after clicking 'Publish Now'.
    // This can help prevent flakiness in dynamic UIs.
    await this.page.waitForTimeout(1000);

    // Click the final publish button
    await expect(this.publishButton).toBeEnabled({ timeout: 10000 });
    await this.publishButton.click();

    // Wait for the confirmation and click 'Done'
    await this.doneButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.doneButton.click();
  }
}
