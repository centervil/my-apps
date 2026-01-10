import path from 'path';
import os from 'os';
import fs from 'fs';

export function getSpotifyAuthPath(): string {
  if (process.env.SPOTIFY_AUTH_PATH) {
    return process.env.SPOTIFY_AUTH_PATH;
  }
  return path.join(os.homedir(), '.my-apps', 'credentials', 'spotify-auth.json');
}

export function ensureAuthDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}