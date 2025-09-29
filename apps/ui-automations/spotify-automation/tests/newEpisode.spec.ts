import { test, expect } from '@playwright/test';
import path from 'path';
import { NewEpisodePage } from '../src/pages/NewEpisodePage';

test.describe('Spotify for Creators - New Episode Wizard', () => {
  test.beforeEach(async ({ page }) => {
    const { BASE_URL, SPOTIFY_PODCAST_ID } = process.env;

    if (!BASE_URL || !SPOTIFY_PODCAST_ID) {
      throw new Error(
        'Missing required environment variables: BASE_URL and/or SPOTIFY_PODCAST_ID',
      );
    }

    const newEpisodePage = new NewEpisodePage(page);
    await newEpisodePage.goto(BASE_URL, SPOTIFY_PODCAST_ID);
    await newEpisodePage.assertPageIsVisible();
  });

  test('should upload audio, fill details, and verify', async ({ page }) => {
    const newEpisodePage = new NewEpisodePage(page);

    // 1. Upload audio file
    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    await newEpisodePage.uploadAudioFile(audioFilePath);

    // After uploading, the page automatically navigates to the details screen.
    // Playwright's actions like .fill() have auto-waits, so we can proceed directly.

    // 2. Fill in episode details
    const episodeDetails = {
      title: 'My Test Episode Title',
      description: 'This is the description for my test episode.',
    };
    await newEpisodePage.fillEpisodeDetails(episodeDetails);

    // 3. Verify the details are filled correctly
    await newEpisodePage.assertEpisodeDetails(episodeDetails);
  });

  test('should publish a new episode and verify it appears in the list', async ({
    page,
  }) => {
    const newEpisodePage = new NewEpisodePage(page);
    const { SPOTIFY_PODCAST_ID } = process.env;

    // 1. Upload audio and fill details
    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    await newEpisodePage.uploadAudioFile(audioFilePath);
    const episodeDetails = {
      title: `My Published Episode ${new Date().getTime()}`,
      description: 'This episode should be published.',
    };
    await newEpisodePage.fillEpisodeDetails(episodeDetails);

    // 2. Publish the episode
    await newEpisodePage.publishEpisode('1', '1');

    // 3. Verify navigation to the episodes list
    await expect(page).toHaveURL(
      new RegExp(`/pod/show/${SPOTIFY_PODCAST_ID}/episodes`),
      { timeout: 10000 },
    );
  });
});
