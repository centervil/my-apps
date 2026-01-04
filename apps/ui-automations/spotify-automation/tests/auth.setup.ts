import * as path from 'path';
import * as fs from 'fs';
import { AuthManager } from '../src/auth/authManager';
import { AuthSetup } from '../src/auth/authSetup';

const resolveAuthFile = () => {
  if (process.env.SPOTIFY_AUTH_PATH) return process.env.SPOTIFY_AUTH_PATH;

  // From tests/auth.setup.ts (in dist or src), relative path to workspace root depends on execution
  // Assuming standard structure:
  const sharedCreds = path.resolve(__dirname, '../../..', 'credentials', 'spotify-auth.json');
  if (fs.existsSync(sharedCreds)) return sharedCreds;

  return path.resolve(__dirname, '..', '.auth', 'spotify-auth.json');
};

const authFile = resolveAuthFile();

async function globalSetup() {
  const authManager = new AuthManager(authFile);

  console.log('--- Global Auth Setup ---');
  console.log('Checking for valid authentication state...');

  await AuthSetup.requireAuthentication(authManager);

  console.log('--- Authentication state is valid. Proceeding with tests. ---');
}

export default globalSetup;
