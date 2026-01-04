import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

// Use process.env.PORT by default and fallback to 3000
const PORT = process.env.PORT || 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the PORT variable.
const baseURL = `http://localhost:${PORT}`;

// Path to the authentication file
const resolveAuthFile = () => {
  if (process.env.SPOTIFY_AUTH_PATH) return process.env.SPOTIFY_AUTH_PATH;
  
  const sharedCreds = path.resolve(__dirname, '../../..', 'credentials', 'spotify-auth.json');
  if (fs.existsSync(sharedCreds)) return sharedCreds;

  return path.resolve(__dirname, '.auth', 'spotify-auth.json');
};

const authFile = resolveAuthFile();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  // Global setup for authentication
  globalSetup: require.resolve('./tests/auth.setup.ts'),

  use: {
    baseURL,
    trace: 'on-first-retry',
    locale: 'en-US',
  },

  projects: [
    // Main project for authenticated tests
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        // Use the saved authentication state
        storageState: authFile,
      },
      // Ignore the setup file in the main test run
      testIgnore: /auth\.setup\.ts/,
    },
  ],
  // webServer: {
  //   command: 'npm run dev',
  //   url: baseURL,
  //   timeout: 120 * 1000,
  //   reuseExistingServer: !process.env.CI,
  // },
});
