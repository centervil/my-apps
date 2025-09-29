import * as path from 'path';
import { AuthManager } from '../src/auth/authManager';
import { AuthSetup } from '../src/auth/authSetup';

const authFile = path.resolve(__dirname, '..', '.auth', 'spotify-auth.json');

async function globalSetup() {
  const authManager = new AuthManager(authFile);

  console.log('--- Global Auth Setup ---');
  console.log('Checking for valid authentication state...');

  await AuthSetup.requireAuthentication(authManager);

  console.log('--- Authentication state is valid. Proceeding with tests. ---');
}

export default globalSetup;
