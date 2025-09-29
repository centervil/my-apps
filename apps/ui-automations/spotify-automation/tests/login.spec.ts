import { test, expect } from '@playwright/test';

test.describe('Spotify for Creators - Authenticated Access', () => {
  // This test assumes that the user is already authenticated via storageState.
  // The auth.setup.ts global setup handles the authentication check.

  test('should be able to access a protected page (e.g., dashboard)', async ({
    page,
  }) => {
    // Navigate directly to a page that requires login.
    await page.goto(
      'https://creators.spotify.com/pod/show/1ptW7cCcrt1Qb3QinuKHc5/home',
      { timeout: 60000 },
    );

    // Assert that the user is on the correct page and not redirected to login.
    await expect(page).toHaveURL(/creators\.spotify\.com\/pod\/show\/.*\/home/);

    // Look for an element that is unique to the logged-in experience,
    // like a heading that says "ホーム" (Home).
    await expect(page.getByTestId('home-link')).toBeVisible();
  });

  test('should redirect from login page to dashboard if already logged in', async ({
    page,
  }) => {
    // Navigate to the login page
    await page.goto('https://creators.spotify.com/pod/login', {
      timeout: 60000,
    });

    // Assert that the user is redirected away from the login page
    // to a dashboard or home page, because they are already authenticated.
    // The URL should not be the login page anymore.
    await expect(page).not.toHaveURL(/.*\/login/);

    // Check that we landed on a page within the creators.spotify.com domain
    await expect(page).toHaveURL(/creators\.spotify\.com/);
  });
});
