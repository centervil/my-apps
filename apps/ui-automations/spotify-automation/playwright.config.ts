import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import * as path from 'path';
import { getSpotifyAuthPath } from './src/utils/paths';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

// Use process.env.PORT by default and fallback to 3000
const PORT = process.env.PORT || 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the PORT variable.
const baseURL = `http://localhost:${PORT}`;

const authFile = getSpotifyAuthPath();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html', { open: 'never' }]],

  // Global setup for authentication
  globalSetup: require.resolve('./tests/auth.setup.ts'),

  // Ignore unit tests and setup file for standard runs
  testIgnore: ['**/tests/unit/**', '**/auth.setup.ts'],

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
