import { test, expect } from '@playwright/test';
import { withRetry } from '../../src/utils/retry';
import { TransientError, AuthExpiredError } from '../../src/utils/errors';
import { mapErrorToExecutionResult } from '../../src/utils/resultReporter';
import { AuthManager, AuthState } from '../../src/auth/authManager';
import { findEpisodeStatus } from '../../src/features/spotifyUploader';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

test.describe('Robustness Unit Tests', () => {
  let tempDir: string;
  let authFilePath: string;

  test.beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'robustness-test-'));
    authFilePath = path.join(tempDir, 'spotify-auth.json');
  });

  test.afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  test('withRetry should succeed on first try if no error', async () => {
    let attempts = 0;
    const result = await withRetry(async () => {
      attempts++;
      return 'success';
    });

    expect(result).toBe('success');
    expect(attempts).toBe(1);
  });

  test('withRetry should retry on transient error and succeed eventually', async () => {
    let attempts = 0;
    const result = await withRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new TransientError('Temporary glitch');
        }
        return 'recovered';
      },
      { retries: 3, delayMs: 10 },
    );

    expect(result).toBe('recovered');
    expect(attempts).toBe(3);
  });

  test('withRetry should throw immediately on PermanentError or AuthExpiredError', async () => {
    let attempts = 0;
    try {
      await withRetry(
        async () => {
          attempts++;
          throw new AuthExpiredError('Session expired');
        },
        { retries: 3, delayMs: 10 },
      );
      expect(true).toBe(false); // should not reach here
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AuthExpiredError);
      expect(attempts).toBe(1);
    }
  });

  test('mapErrorToExecutionResult should map AuthExpiredError correctly (exit code 2)', () => {
    const error = new AuthExpiredError('Expired session test');
    const result = mapErrorToExecutionResult(error, Date.now() - 500);

    expect(result.success).toBe(false);
    expect(result.status).toBe('AUTH_EXPIRED');
    expect(result.exitCode).toBe(2);
    expect(result.errorCode).toBe('AUTH_EXPIRED');
  });

  test('mapErrorToExecutionResult should map TransientError correctly (exit code 3)', () => {
    const error = new TransientError('Network glitch', 'MAX_RETRIES_EXCEEDED');
    const result = mapErrorToExecutionResult(error, Date.now() - 1000);

    expect(result.success).toBe(false);
    expect(result.status).toBe('TRANSIENT_FAILURE');
    expect(result.exitCode).toBe(3);
    expect(result.errorCode).toBe('MAX_RETRIES_EXCEEDED');
  });

  test('AuthManager session validation identifies expired session correctly', async () => {
    // Create an auth file with timestamp older than 720 hours
    const expiredState: AuthState = {
      cookies: [],
      localStorage: {},
      sessionStorage: {},
      timestamp: Date.now() - (721 * 60 * 60 * 1000), // 721 hours ago
    };
    await fs.writeFile(authFilePath, JSON.stringify(expiredState));
    const authManager = new AuthManager(authFilePath);

    let threwAuthError = false;
    try {
      await authManager.isAuthValid(720);
    } catch (err: unknown) {
      const error = err as Record<string, unknown>;
      if (error.code === 'EXPIRED_AUTH') {
        threwAuthError = true;
      }
    }
    expect(threwAuthError).toBe(true);
  });

  test.describe('findEpisodeStatus Unit Tests', () => {
    test('should return Published when row contains title and Published status', () => {
      const rows = ['Other Episode Draft 11/24/26', 'My Title Published 11/25/26 Audio 00:03'];
      expect(findEpisodeStatus(rows, 'My Title')).toBe('Published');
    });

    test('should return Draft when row contains title and Draft status', () => {
      const rows = ['My Title Draft 11/25/26 Audio 00:03'];
      expect(findEpisodeStatus(rows, 'My Title')).toBe('Draft');
    });

    test('should return Scheduled when row contains title and Scheduled status', () => {
      const rows = ['My Title Scheduled 11/25/26 Audio 00:03'];
      expect(findEpisodeStatus(rows, 'My Title')).toBe('Scheduled');
    });

    test('should return null when title is absent', () => {
      const rows = ['Another Title Published 11/25/26'];
      expect(findEpisodeStatus(rows, 'My Title')).toBeNull();
    });

    test('should return first row status when multiple rows contain the same title', () => {
      const rows = [
        'My Title Draft 11/24/26',
        'My Title Published 11/25/26',
      ];
      expect(findEpisodeStatus(rows, 'My Title')).toBe('Draft');
    });

    test('should work correctly via containment when title is a substring of a longer title', () => {
      // e.g. title "Episode" is contained in "Episode 1: Intro"
      const rows = ['Episode 1: Intro Published 11/25/26'];
      expect(findEpisodeStatus(rows, 'Episode')).toBe('Published');
    });
  });
});
