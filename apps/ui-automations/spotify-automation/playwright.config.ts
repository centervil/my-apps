import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../..', '.env') });

// Use process.env.PORT by default and fallback to 3000
const PORT = process.env.PORT || 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the PORT variable.
const baseURL = `http://localhost:${PORT}`;

// Path to the authentication file
const authFile = path.resolve(__dirname, '.auth', 'spotify-auth.json');

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
  },

  projects: [
    // Main project for authenticated tests
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
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
