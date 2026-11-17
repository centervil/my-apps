import { firefox, type Page } from '@playwright/test';
import fs from 'fs';
import { NewEpisodePage } from '../pages/NewEpisodePage';
import { getSpotifyAuthPath, getScreenshotPath } from '../utils/paths';
import { AuthManager } from '../auth/authManager';
import { withRetry } from '../utils/retry';
import { TransientError, AuthExpiredError } from '../utils/errors';

// エピソード詳細のデータ構造を定義
export interface EpisodeDetails {
  title: string;
  description: string;
  audioFilePath: string;
  season: string;
  episode: string;
}

export interface SpotifyUploadOptions {
  showId: string;
  audioPath: string;
  title: string;
  description: string;
  season?: number;
  episode?: number;
  retries?: number;
}

/**
 * 指定されたエピソード情報をSpotifyにアップロードし、公開します。
 * @param page - PlaywrightのPageオブジェクト
 * @param details - アップロードするエピソードの詳細
 */
export async function uploadAndPublishEpisode(
  page: Page,
  details: EpisodeDetails,
): Promise<void> {
  const newEpisodePage = new NewEpisodePage(page);

  try {
    // 1. Upload audio file
    await newEpisodePage.uploadAudioFile(details.audioFilePath);

    // 2. Fill in episode details
    await newEpisodePage.fillEpisodeDetails(details);

    // 3. Publish the episode
    await newEpisodePage.publishEpisode();
  } catch (error: unknown) {
    const err = error as Record<string, unknown>;
    // Check if error is related to authentication / login loss during navigation or wizard
    const pageContent = await page.content().catch(() => '');
    if (
      pageContent.includes('Log in') ||
      pageContent.includes('Sign in') ||
      page.url().includes('login')
    ) {
      throw new AuthExpiredError('Detected login page or redirect during upload process. Session has expired.');
    }

    // Wrap in TransientError if it looks temporary (network / timeout / element not found)
    if (
      err.name === 'TimeoutError' ||
      (typeof err.message === 'string' && (err.message.includes('Timeout') || err.message.includes('net::') || err.message.includes('network')))
    ) {
      throw new TransientError(`Transient upload error: ${String(err.message)}`);
    }
    throw error;
  }
}

/**
 * Main function to orchestrate the entire upload process with retry logic.
 * @param options - Options for the upload, including showId and audioPath.
 */
export async function runSpotifyUpload(options: SpotifyUploadOptions) {
  const { showId, audioPath, title, description, season, episode, retries = 3 } = options;
  const baseUrl = 'https://creators.spotify.com';

  const authFilePath = getSpotifyAuthPath();
  if (!fs.existsSync(authFilePath)) {
    throw new AuthExpiredError(
      `Authentication file not found at: ${authFilePath}. Please ensure you have a valid session file.`,
    );
  }

  // Validate authentication before launching browser
  const authManager = new AuthManager(authFilePath);
  try {
    await authManager.isAuthValid();
    console.log('Authentication state is valid.');
  } catch (error) {
    console.error('❌ Authentication check failed. Session expired or invalid.');
    throw error;
  }

  // Wrap upload execution in retry mechanism for transient errors
  await withRetry(
    async () => {
      const browser = await firefox.launch({
        headless: true,
        args: ['--width=1920', '--height=1080'],
      });
      const context = await browser.newContext({
        storageState: authFilePath,
        locale: 'en-US',
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();

      try {
        console.log('Session state loaded successfully.');

        // Navigate to episode upload wizard
        const newEpisodePage = new NewEpisodePage(page);
        await newEpisodePage.goto(baseUrl, showId);
        await newEpisodePage.assertPageIsVisible();
        console.log('Navigated to new episode page.');

        const episodeDetails: EpisodeDetails = {
          title: title,
          description: description,
          audioFilePath: audioPath,
          season: season ? String(season) : '1',
          episode:
            episode
              ? String(episode)
              : String(Math.floor(Date.now() / 1000)),
        };
        console.log(`Uploading episode with details:
${JSON.stringify(
          episodeDetails,
          null,
          2,
        )}`);

        // Call the modular upload function
        await uploadAndPublishEpisode(page, episodeDetails);

        console.log('✅ Episode uploaded and published successfully!');
      } catch (error) {
        console.error(
          '❌ An error occurred during the Spotify upload process:',
          error,
        );
        const screenshotPath = getScreenshotPath();
        await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
        console.error(`📸 Screenshot saved to ${screenshotPath}`);
        throw error;
      } finally {
        await browser.close();
      }
    },
    {
      retries,
      delayMs: 2000,
      onRetry: (err, attempt) => {
        console.warn(`[WARN] Upload attempt ${attempt} failed with transient error: ${err.message}. Retrying...`);
      },
    },
  );
}