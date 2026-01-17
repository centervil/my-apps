import path from 'path';
import os from 'os';
import fs from 'fs';

export function getSpotifyAuthPath(): string {
  if (process.env.SPOTIFY_AUTH_PATH) {
    return path.resolve(process.env.SPOTIFY_AUTH_PATH);
  }
  // Resolve path relative to this file to find the workspace root credentials
  // apps/ui-automations/spotify-automation/src/utils/paths.ts -> workspace/credentials/spotify-auth.json
  return path.resolve(__dirname, '../../../../../credentials/spotify-auth.json');
}

export function ensureAuthDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getScreenshotPath(): string {
  let dir = process.env.SPOTIFY_AUTOMATION_OUTPUT_DIR;

  if (!dir) {
    dir = path.join(
      process.cwd(),
      'dist',
      'apps',
      'ui-automations',
      'spotify-automation',
      'screenshots',
    );
  }

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `error-${timestamp}.png`;

  return path.join(dir, filename);
}