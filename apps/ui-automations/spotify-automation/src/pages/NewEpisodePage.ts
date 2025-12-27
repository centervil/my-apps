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
  private readonly inAppMessageCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.selectFileButton = page
      .getByTestId('uploadAreaWrapper')
      .getByRole('button', { name: /select a file/i });
    this.titleInput = page.locator('#title-input');
    this.descriptionInput = page.locator('div[name="description"]');
    this.seasonNumberInput = page.locator('#season-number');
    this.episodeNumberInput = page.locator('#episode-number');
    this.privacyBannerCloseButton = page
      .getByRole('dialog', { name: /privacy/i })
      .getByRole('button', { name: /close/i });
    this.nextButton = page
      .getByTestId('dialog-footer')
      .getByRole('button', { name: /next/i });
    this.publishNowOption = page.locator('#publish-date-now');
    this.publishButton = page
      .getByTestId('dialog-footer')
      .getByRole('button', { name: /publish/i });
    this.doneButton = page.getByRole('button', { name: /done|close/i });
    this.inAppMessageCloseButton = page
      .locator('[class*="ab-iam"]')
      .getByRole('button')
      .first();
  }

  async goto(baseUrl: string, podcastId: string) {
    await this.page.goto(`${baseUrl}/pod/show/${podcastId}/episode/wizard`, {
      timeout: 60000,
    });
    // Wait for network to be somewhat idle as Spotify is a heavy SPA
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      console.log('Timeout waiting for networkidle, proceeding anyway...');
    });
  }

  async assertPageIsVisible() {
    await expect(this.selectFileButton).toBeVisible({ timeout: 30000 });
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

  async fillEpisodeDetails(details: {
    title: string;
    description: string;
    season?: string;
    episode?: string;
  }) {
    // Wait for the form to be ready after upload
    await this.titleInput.waitFor({ state: 'visible', timeout: 30000 });
    await this.page.waitForTimeout(2000); // Give it a moment to stabilize

    await this.titleInput.fill(details.title);
    
    await this.descriptionInput.waitFor({ state: 'visible', timeout: 10000 });
    await this.descriptionInput.fill(details.description);

    if (details.season) {
      await this.seasonNumberInput.waitFor({ state: 'visible', timeout: 5000 });
      await this.seasonNumberInput.fill(details.season);
    }
    if (details.episode) {
      await this.episodeNumberInput.waitFor({ state: 'visible', timeout: 5000 });
      await this.episodeNumberInput.fill(details.episode);
    }
  }

  async assertEpisodeDetails(details: {
    title: string;
    description: string;
    season?: string;
    episode?: string;
  }) {
    await expect(this.titleInput).toHaveValue(details.title);
    await expect(this.descriptionInput).toHaveText(details.description);
    if (details.season) {
      await expect(this.seasonNumberInput).toHaveValue(details.season);
    }
    if (details.episode) {
      await expect(this.episodeNumberInput).toHaveValue(details.episode);
    }
  }

  async publishEpisode() {
    // Wait for the Next button to be enabled after file upload, indicating processing is done.
    await expect(this.nextButton).toBeEnabled({ timeout: 30000 });
    await this.nextButton.waitFor({ state: 'visible', timeout: 10000 });

    // The privacy banner might obscure the 'Next' button. Close it if it's visible.
    if (await this.privacyBannerCloseButton.isVisible()) {
      await this.privacyBannerCloseButton.click();
    }

    // Proceed to the next step in the wizard
    await this.nextButton.click();

    // On the next screen, select to publish immediately
    await this.publishNowOption.click({ force: true });

    // Add a small strategic delay to wait for UI updates after clicking 'Publish Now'.
    await this.page.waitForTimeout(2000);

    // Click the final publish button
    await this.publishButton.waitFor({ state: 'visible', timeout: 10000 });
    await expect(this.publishButton).toBeEnabled({ timeout: 10000 });

    // Handle potential in-app message overlay
    if (await this.inAppMessageCloseButton.isVisible({ timeout: 5000 })) {
      await this.inAppMessageCloseButton.click();
    }

    await this.publishButton.click();

    // Wait for the confirmation and click 'Done'
    await this.doneButton.waitFor({ state: 'visible', timeout: 10000 });
    await this.doneButton.click();
  }
}
