import { chromium, type Page } from '@playwright/test';
import fs from 'fs';
import { NewEpisodePage } from '../pages/NewEpisodePage';
import path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

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
  await newEpisodePage.publishEpisode();
}

/**
 * Main function to orchestrate the entire upload process.
 * Launches a browser, logs in, and uploads the episode.
 * @param options - Options for the upload, including showId and audioPath.
 */
export async function runSpotifyUpload(options: {
  showId: string;
  audioPath: string;
  title: string;
  description: string;
  season?: number;
  episode?: number;
}) {
  const { showId, audioPath, title, description, season, episode } = options;
  const baseUrl = 'https://podcasters.spotify.com';

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
    // Fallback to the default path if the environment variable is not set.
    const defaultPath = path.resolve(
      __dirname,
      '../../.auth/spotify-auth.json',
    );
    if (!fs.existsSync(defaultPath)) {
      throw new Error(
        `Authentication file not found at default path: ${defaultPath}. Please ensure you have a valid session file or set the SPOTIFY_AUTH_PATH environment variable.`,
      );
    }
    return defaultPath;
  };

  const authFilePath = getAuthPath();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: authFilePath,
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

export async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('config', {
      type: 'string',
      description: 'Path to a JSON configuration file',
    })
    .option('showId', {
      type: 'string',
      description: 'Spotify show ID',
    })
    .option('audioPath', {
      type: 'string',
      description: 'Path to the audio file',
    })
    .option('title', {
      type: 'string',
      description: 'Episode title',
    })
    .option('description', {
      type: 'string',
      description: 'Episode description',
    })
    .option('season', {
        type: 'number',
        description: 'Season number'
    })
    .option('episode', {
        type: 'number',
        description: 'Episode number'
    })
    .option('dryRun', {
        type: 'boolean',
        description: 'Perform a dry run without uploading',
    })
    .help()
    .argv;

  let options = {};

  if (argv.config) {
    if (!fs.existsSync(argv.config)) {
        throw new Error(`Configuration file not found at: ${argv.config}`);
    }
    const configFromFile = JSON.parse(fs.readFileSync(argv.config, 'utf-8'));
    options = { ...configFromFile, ...argv };
  } else {
    options = argv;
  }

  let { showId, audioPath, title, description, season, episode, dryRun } = options as any;

  if (!showId || !audioPath || !title || !description) {
    throw new Error('Missing required arguments: showId, audioPath, title, description');
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error(`The specified path does not exist: ${audioPath}`);
  }

  const stats = fs.statSync(audioPath);
  if (stats.isDirectory()) {
    const files = fs.readdirSync(audioPath);
    if (files.length === 0) {
      throw new Error(`No audio file found in the specified directory: ${audioPath}`);
    }
    // Find the newest file
    const newestFile = files.map(file => ({
      name: file,
      time: fs.statSync(path.join(audioPath, file)).mtime.getTime(),
    })).sort((a, b) => b.time - a.time)[0];
    audioPath = path.join(audioPath, newestFile.name);
  }

  if (dryRun) {
    console.log(JSON.stringify({ showId, audioPath, title, description, season, episode }, null, 2));
    return;
  }

  await runSpotifyUpload({ showId, audioPath, title, description, season, episode });
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Operation failed:', error.message);
        process.exit(1);
    });
}
