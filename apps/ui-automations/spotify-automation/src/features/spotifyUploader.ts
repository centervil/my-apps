import type { Page } from '@playwright/test';
import { NewEpisodePage } from '../pages/NewEpisodePage';

// エピソード詳細のデータ構造を定義
export interface EpisodeDetails {
  title: string;
  description: string;
  audioFilePath: string;
  season: string;
  episode: string;
}

/**
 * 指定されたエピソード情報をSpotifyにアップロードし、公開します。
 * @param page - PlaywrightのPageオブジェクト
 * @param details - アップロードするエピソードの詳細
 */
export async function uploadAndPublishEpisode(
  page: Page,
  details: EpisodeDetails,
): Promise<void> {
  const newEpisodePage = new NewEpisodePage(page);

  // 1. Upload audio file
  await newEpisodePage.uploadAudioFile(details.audioFilePath);

  // 2. Fill in episode details
  await newEpisodePage.fillEpisodeDetails(details);

  // 3. Publish the episode
  await newEpisodePage.publishEpisode(details.season, details.episode);
}
