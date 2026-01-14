import { test, expect } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { AuthManager, AuthState } from '../../../src/auth/authManager';
import { AuthError } from '../../../src/auth/authErrors';

test.describe('AuthManager Unit Tests', () => {
  let tempDir: string;
  let authFilePath: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'auth-test-'));
    authFilePath = path.join(tempDir, 'spotify-auth.json');
  });

  test.afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('isAuthValid should return true for valid auth file and non-expired cookies', async () => {
    const validState: AuthState = {
      cookies: [
        {
          name: 'sp_t',
          value: 'token',
          domain: '.spotify.com',
          path: '/',
          expires: Math.floor(Date.now() / 1000) + 3600, // Expires in 1 hour
          httpOnly: true,
          secure: true,
          sameSite: 'None',
        },
      ],
      localStorage: {},
      sessionStorage: {},
      timestamp: Date.now(),
    };

    await fs.writeFile(authFilePath, JSON.stringify(validState));
    const authManager = new AuthManager(authFilePath);
    expect(await authManager.isAuthValid()).toBe(true);
  });

  test('isAuthValid should throw EXPIRED_AUTH error if a cookie is expired', async () => {
    const expiredState: AuthState = {
      cookies: [
        {
          name: 'sp_t',
          value: 'token',
          domain: '.spotify.com',
          path: '/',
          expires: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
          httpOnly: true,
          secure: true,
          sameSite: 'None',
        },
      ],
      localStorage: {},
      sessionStorage: {},
      timestamp: Date.now(),
    };

    await fs.writeFile(authFilePath, JSON.stringify(expiredState));
    const authManager = new AuthManager(authFilePath);

    try {
      await authManager.isAuthValid();
      throw new Error('Should have thrown AuthError');
    } catch (error) {
      expect(error).toBeInstanceOf(AuthError);
      expect((error as AuthError).code).toBe('EXPIRED_AUTH');
    }
  });

  test('isAuthValid should ignore session cookies (no expires or -1)', async () => {
    const sessionCookieState: AuthState = {
      cookies: [
        {
          name: 'sp_session',
          value: 'session_token',
          domain: '.spotify.com',
          path: '/',
          expires: -1, 
          httpOnly: true,
          secure: true,
          sameSite: 'None',
        },
      ],
      localStorage: {},
      sessionStorage: {},
      timestamp: Date.now(),
    };

    await fs.writeFile(authFilePath, JSON.stringify(sessionCookieState));
    const authManager = new AuthManager(authFilePath);
    expect(await authManager.isAuthValid()).toBe(true);
  });
});
