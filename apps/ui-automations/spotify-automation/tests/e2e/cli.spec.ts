import { test, expect } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from the root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../../..', '.env') });

// Design doc: apps/ui-automations/spotify-automation/docs/issues/81/design.md
interface RunCliOptions {
  timeout?: number;
}

interface RunCliResult {
  stdout: string;
  stderr: string;
  code: number | null;
  signal: string | null;
  timedOut: boolean;
}

const runCli = (
  args: string[],
  env: NodeJS.ProcessEnv = {},
  options: RunCliOptions = {},
): Promise<RunCliResult> => {
  return new Promise((resolve) => {
    const { timeout = 0 } = options;
    let timer: NodeJS.Timeout;

    const projectRoot = path.resolve(__dirname, '../../../../..');
    const envPath = path.join(projectRoot, '.env');
    const envConfig = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

    const command = 'pnpm';
    const fullArgs = ['--filter', '@my-apps/spotify-automation', 'run', 'upload', ...args];


    const childProcess = spawn(command, fullArgs, {
      env: {
        ...process.env,
        ...envConfig,
        ...env,
      },
      cwd: projectRoot,
      detached: true, // Important for killing the process tree
    });

    let stdout = '';
    let stderr = '';

    const cleanup = () => {
      if (timer) clearTimeout(timer);
    };

    if (timeout > 0) {
      timer = setTimeout(() => {
        if (childProcess.pid) {
          process.kill(-childProcess.pid, 'SIGKILL');
        }
        cleanup();
        resolve({ stdout, stderr, code: null, signal: 'SIGKILL', timedOut: true });
      }, timeout);
    }

    childProcess.stdout.on('data', (data) => (stdout += data.toString()));
    childProcess.stderr.on('data', (data) => (stderr += data.toString()));

    childProcess.on('close', (code, signal) => {
      cleanup();
      resolve({ stdout, stderr, code, signal, timedOut: false });
    });

    childProcess.on('error', (err) => {
      cleanup();
      stderr += `Failed to start subprocess: ${err.message}`;
      resolve({ stdout, stderr, code: 1, signal: null, timedOut: false });
    });
  });
};

test.describe('Spotify Automation CLI - E2E Tests', () => {
  test('should fail with an error if --showId is not provided', async () => {
    const { stdout, stderr, code } = await runCli([]);

    expect(code).not.toBe(0);
    // Check for the specific error message from the CLI's argument parser
    expect(stderr).toContain("必須の引数が見つかりません: showId");
  });

  test('should perform a successful dry run with a local audio file', async () => {
    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    const args = [
      '--showId', process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath', audioFilePath,
      '--dryRun'
    ];
    const { stdout, stderr, code } = await runCli(args);

    expect(stdout).toContain("Dry run would proceed with these values.");
  });

  test.skip('should perform a successful dry run using the Google Drive fallback', async () => {

    // Setup: Create a dummy file in the fallback directory
    const fallbackDir = path.resolve(__dirname, '../../../../../tmp/downloads');
    const dummyFileName = `test-audio-${Date.now()}.mp3`;
    const dummyFilePath = path.join(fallbackDir, dummyFileName);

    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true });
    }
    const args = [
      '--showId', process.env.SPOTIFY_PODCAST_ID as string,
      '--dryRun'
    ];

    try {
      const { stdout, stderr, code } = await runCli(args);

      expect(code).toBe(0);
      expect(stdout).toContain('🎧 Audio path not provided, searching for the latest file in `tmp/downloads`...');
      expect(stdout).toContain(`✅ Found audio file: ${dummyFilePath}`);
      expect(stdout).toContain("Dry run: Upload successful!");

    } finally {
      // Teardown: Clean up the dummy file
      if (fs.existsSync(dummyFilePath)) {
        fs.unlinkSync(dummyFilePath);
      }
    }
  });

  test.skip('should fail if the specified --audioPath does not exist', async () => {
    const nonExistentFilePath = '/tmp/non-existent-file-12345.mp3';
    const args = [
      '--showId', process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath', nonExistentFilePath,
      // No --dryRun, as we need the upload process to start to hit the file system error
    ];

    const { stdout, stderr, code } = await runCli(args);

    expect(code).not.toBe(0);
    expect(stderr).toContain(`The specified audio file does not exist: ${nonExistentFilePath}`);
  });
});
