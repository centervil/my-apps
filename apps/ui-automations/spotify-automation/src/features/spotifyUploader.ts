import { chromium, type Page } from '@playwright/test';
import { NewEpisodePage } from '../pages/NewEpisodePage';
import { LoginPage } from '../pages/loginPage';
import path from 'path';

// エピソード詳細のデータ構造を定義
export interface EpisodeDetails {
  title: string;
  description: string;
  audioFilePath: string;
  season: string;
  episode: string;
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
  await newEpisodePage.publishEpisode(details.season, details.episode);
}

/**
 * Main function to orchestrate the entire upload process.
 * Launches a browser, logs in, and uploads the episode.
 * @param options - Options for the upload, including showId and audioPath.
 */
export async function runSpotifyUpload(options: { showId: string; audioPath: string; }) {
  const { showId, audioPath } = options;

  const email = process.env.SPOTIFY_EMAIL;
  const password = process.env.SPOTIFY_PASSWORD;
  const baseUrl = 'https://podcasters.spotify.com';

  if (!email || !password) {
    throw new Error('Spotify email or password not set in environment variables. Make sure .env file is loaded.');
  }

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(email, password);
    await page.waitForURL(`${baseUrl}/**`, { timeout: 60000 });
    console.log('Successfully logged in.');

    // Navigate to episode upload wizard
    const newEpisodePage = new NewEpisodePage(page);
    await newEpisodePage.goto(baseUrl, showId);
    await newEpisodePage.assertPageIsVisible();
    console.log('Navigated to new episode page.');

    // TODO: Replace placeholder details with actual data from a config file or filename parsing.
    const episodeDetails: EpisodeDetails = {
      title: `Automated Upload: ${path.basename(audioPath)}`,
      description: `This episode was uploaded automatically on ${new Date().toLocaleString()}.`,
      audioFilePath: audioPath,
      season: '1', // Placeholder
      episode: String(Math.floor(Date.now() / 1000)), // Placeholder, use timestamp for uniqueness
    };

    console.log(`Uploading episode with details:
${JSON.stringify(episodeDetails, null, 2)}`);

    // Call the modular upload function
    await uploadAndPublishEpisode(page, episodeDetails);

    console.log('✅ Episode uploaded and published successfully!');

  } catch (error) {
    console.error('❌ An error occurred during the Spotify upload process:', error);
    const screenshotPath = path.resolve(process.cwd(), 'error-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.error(`📸 Screenshot saved to ${screenshotPath}`);
    // Re-throw the error to be caught by the CLI script
    throw error;
  } finally {
    await browser.close();
  }
}