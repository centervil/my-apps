import { test } from '@playwright/test';
import path from 'path';
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

  test('should upload an audio file and verify the result', async ({ page }) => {
    const { BASE_URL, SPOTIFY_PODCAST_ID } = process.env;

    if (!BASE_URL || !SPOTIFY_PODCAST_ID) {
      throw new Error(
        'Missing required environment variables: BASE_URL and/or SPOTIFY_PODCAST_ID'
      );
    }

    const newEpisodePage = new NewEpisodePage(page);
    await newEpisodePage.goto(BASE_URL, SPOTIFY_PODCAST_ID);
    await newEpisodePage.assertPageIsVisible();

    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    await newEpisodePage.uploadAudioFile(audioFilePath);

    await newEpisodePage.assertFileUploaded('test-audio.mp3');
  });
});
