import { firefox, type Page } from '@playwright/test';
import fs from 'fs';
import { NewEpisodePage } from '../pages/NewEpisodePage';
import path from 'path';

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
}

/**
 * 指定されたエピソード情報をSpotifyにアップロードし、公開します。
 * (This function is kept for modularity)
 * @param page - PlaywrightのPageオブジェクト
 * @param details - アップロードするエピソードの詳細
 */
export async function uploadAndPublishEpisode(
  page: Page,
  details: EpisodeDetails,
): Promise<void> {
  const newEpisodePage = new NewEpisodePage(page);

  // 1. Upload audio file
  await newEpisodePage.uploadAudioFile(details.audioFilePath);

  // 2. Fill in episode details
  await newEpisodePage.fillEpisodeDetails(details);

  // 3. Publish the episode
  await newEpisodePage.publishEpisode();
}

/**
 * Main function to orchestrate the entire upload process.
 * Launches a browser, logs in, and uploads the episode.
 * @param options - Options for the upload, including showId and audioPath.
 */
export async function runSpotifyUpload(options: SpotifyUploadOptions) {
  const { showId, audioPath, title, description, season, episode } = options;
  const baseUrl = 'https://creators.spotify.com';

  const getAuthPath = (): string => {
    const fromEnv = process.env.SPOTIFY_AUTH_PATH;
    if (fromEnv) {
      // If the path from the environment variable doesn't exist, throw an error.
      if (!fs.existsSync(fromEnv)) {
        throw new Error(
          `Authentication file not found at environment variable path: ${fromEnv}.`,
        );
      }
      return fromEnv;
    }

    // Check shared credentials in workspace root
    // src/features (2) + spotify-automation (1) + ui-automations (1) + apps (1) = 5 levels up to workspace root
    const sharedCredsPath = path.resolve(__dirname, '../../../../..', 'credentials', 'spotify-auth.json');
    if (fs.existsSync(sharedCredsPath)) {
      return sharedCredsPath;
    }

    // Fallback to the default path if the environment variable is not set and shared creds not found.
    const defaultPath = path.resolve(
      __dirname,
      '../../.auth/spotify-auth.json',
    );
    if (!fs.existsSync(defaultPath)) {
      throw new Error(
        `Authentication file not found at default path: ${defaultPath} or shared path: ${sharedCredsPath}. Please ensure you have a valid session file or set the SPOTIFY_AUTH_PATH environment variable.`,
      );
    }
    return defaultPath;
  };

  const authFilePath = getAuthPath();

  // Set browsers path if it exists but is not set in env
  const expectedBrowsersPath = '/ms-playwright';
  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync(expectedBrowsersPath)) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = expectedBrowsersPath;
  }

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
    // Session is loaded from storageState, no login needed.
    console.log('Session state loaded successfully.');

    // Navigate to episode upload wizard
    const newEpisodePage = new NewEpisodePage(page);
    await newEpisodePage.goto(baseUrl, showId);
    await newEpisodePage.assertPageIsVisible();
    console.log('Navigated to new episode page.');

    // TODO: Replace placeholder details with actual data from a config file or filename parsing.
    const episodeDetails: EpisodeDetails = {
      title: title,
      description: description,
      audioFilePath: audioPath,
      season: season ? String(season) : '1', // Use provided season or placeholder
      episode:
        episode
          ? String(episode)
          : String(Math.floor(Date.now() / 1000)), // Use provided episode or placeholder
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
    const screenshotPath = path.resolve(process.cwd(), 'error-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`📸 Screenshot saved to ${screenshotPath}`);
    // Re-throw the error to be caught by the CLI script
    throw error;
  } finally {
    await browser.close();
  }
}


