import { test } from '@playwright/test';
import { NewEpisodePage } from '../src/pages/NewEpisodePage';

test.describe('Spotify for Creators - New Episode Wizard', () => {
  test('should navigate to the new episode wizard page', async ({ page }) => {
    const { BASE_URL, SPOTIFY_PODCAST_ID } = process.env;

    if (!BASE_URL || !SPOTIFY_PODCAST_ID) {
      throw new Error(
        'Missing required environment variables: BASE_URL and/or SPOTIFY_PODCAST_ID'
      );
    }

    const newEpisodePage = new NewEpisodePage(page);
    await newEpisodePage.goto(BASE_URL, SPOTIFY_PODCAST_ID);
    await newEpisodePage.assertPageIsVisible();
  });
});
