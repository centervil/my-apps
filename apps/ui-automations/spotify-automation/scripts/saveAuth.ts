import { chromium, type Page } from '@playwright/test';
import * as path from 'path';
import { AuthManager } from '../src/auth/authManager';

const defaultAuthFilePath = path.resolve(__dirname, '..', '.auth', 'spotify-auth.json');

interface SaveAuthOptions {
  headless?: boolean;
  timeout?: number;
  outputPath?: string;
}

async function saveSpotifyAuth(options: SaveAuthOptions = {}): Promise<void> {
  const { headless = false, timeout = 120000, outputPath = defaultAuthFilePath } = options;
  const authManager = new AuthManager(outputPath);

  console.log('launching browser...');
  const browser = await chromium.launch({ 
    headless,
    args: ['--no-sandbox', '--disable-gpu']
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to Spotify login page...');
  await page.goto('https://creators.spotify.com/pod/login');

  console.log(
    `\nPlease log in to Spotify in the browser window. The script will automatically detect successful login.`
  );

  try {
    // Wait for navigation to the specific URL indicating successful login
    await page.waitForURL('https://creators.spotify.com/pod/show/1ptW7cCcrt1Qb3QinuKHc5/home', { timeout });

    console.log('Login successful. Saving authentication state...');

    await authManager.saveAuthState(page);

    console.log(`Authentication state saved to ${outputPath}`);
  } catch (error) {
    console.error(
      'Error during login or authentication saving process:',
      error
    );
  } finally {
    if (browser.isConnected()) {
      await browser.close();
    }
  }
}

// Execute the script
saveSpotifyAuth().catch(console.error);
