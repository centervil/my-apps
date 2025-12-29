import { chromium } from '@playwright/test';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AuthManager } from '../src/auth/authManager';

const defaultAuthFilePath = path.resolve(
  __dirname,
  '..',
  '.auth',
  'spotify-auth.json',
);

interface SaveAuthOptions {
  headless?: boolean;
  outputPath?: string;
}

async function saveSpotifyAuth(options: SaveAuthOptions = {}): Promise<void> {
  const {
    headless = false,
    outputPath = defaultAuthFilePath,
  } = options;
  const authManager = new AuthManager(outputPath);

  console.log('launching browser...');
  const browser = await chromium.launch({
    headless,
    args: ['--no-sandbox', '--disable-gpu'],
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to Spotify login page...');
  await page.goto('https://creators.spotify.com/pod/login');

  console.log(
    `\n*** ACTION REQUIRED ***\nPlease log in to Spotify in the browser window.\nOnce you are successfully logged in, please CLOSE THE BROWSER WINDOW to continue.`,
  );

  try {
    await new Promise<void>(resolve => {
      page.on('close', async () => {
        console.log('Browser window closed by user. Saving authentication state...');
        try {
          await authManager.saveAuthState(context);
          console.log(`Authentication state saved to ${outputPath}`);
        } catch (saveError) {
          console.error('Failed to save authentication state:', saveError);
        }
        resolve();
      });
    });

  } catch (error) {
    console.error(
      'Error during login or authentication saving process:',
      error,
    );
  } finally {
    if (browser.isConnected()) {
      await browser.close();
    }
    process.stdin.pause(); // Stop listening for input
  }
}

// Parse command line arguments and execute the script
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('headless', {
      type: 'boolean',
      description: 'Run browser in headless mode',
      default: false,
    })
    .option('outputPath', {
      type: 'string',
      description: 'Path to save the authentication file',
      default: defaultAuthFilePath,
    })
    .help()
    .parse();

  await saveSpotifyAuth({
    headless: argv.headless,
    outputPath: argv.outputPath,
  });
}

main().catch(console.error);
