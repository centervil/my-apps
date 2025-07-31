import { test, expect } from '@playwright/test';
import { LoginPage } from '../src/pages/loginPage';

test.describe('Spotify for Creators Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('should display the login page', async ({ page }) => {
    await expect(page).toHaveTitle(/ログイン - Spotify/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginPage.login(process.env.SPOTIFY_EMAIL!, process.env.SPOTIFY_PASSWORD!);

    // Assert that the URL after login is the account overview page
    await expect(page).toHaveURL(/.*\/status/);
  });
});
