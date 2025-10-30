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
    const envConfig = fs.existsSync(envPath)
      ? dotenv.parse(fs.readFileSync(envPath))
      : {};

    const command = path.resolve(
      __dirname,
      '../../scripts/upload.sh',
    );
    const fullArgs = [...args];

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
        resolve({
          stdout,
          stderr,
          code: null,
          signal: 'SIGKILL',
          timedOut: true,
        });
      }, timeout);
    }

    childProcess.stdout.on('data', (data) => (stdout += data.toString()));
    childProcess.stderr.on('data', (data) => (stderr += data.toString()));

    childProcess.on('close', (code, signal) => {
      cleanup();
      const lines = stdout.split('\n');
      let jsonStartIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('{')) {
          jsonStartIndex = i;
          break;
        }
      }

      let filteredStdout = '';
      if (jsonStartIndex !== -1) {
        filteredStdout = lines.slice(jsonStartIndex).join('\n');
      }
      resolve({ stdout: filteredStdout, stderr, code, signal, timedOut: false });
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
    const { stderr, code } = await runCli([]);

    expect(code).not.toBe(0);
    // Check for the specific error message from the CLI's argument parser
    expect(stderr).toContain('Missing required arguments: showId, audioPath, title, description');
  });

  test('should perform a successful dry run with a local audio file', async () => {
    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    const args = [
      '--showId',
      process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath',
      audioFilePath,
      '--title',
      'Test Title',
      '--description',
      'Test Description',
      '--dryRun',
    ];
    const { stdout, code } = await runCli(args);

    expect(code).toBe(0);
    const output = JSON.parse(stdout);
    expect(output).toHaveProperty('title', 'Test Title');
    expect(output).toHaveProperty('description', 'Test Description');
  });

  test('should perform a successful dry run with season and episode numbers', async () => {
    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    const args = [
      '--showId',
      process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath',
      audioFilePath,
      '--title',
      'Test Title',
      '--description',
      'Test Description',
      '--season',
      '2',
      '--episode',
      '10',
      '--dryRun',
    ];
    const { stdout, code } = await runCli(args);

    expect(code).toBe(0);
    const output = JSON.parse(stdout);
    expect(output).toMatchObject({
      title: 'Test Title',
      description: 'Test Description',
      season: 2,
      episode: 10,
    });
  });



  test('should fail if the specified --audioPath does not exist', async () => {
    const nonExistentFilePath = '/tmp/non-existent-file-12345.mp3';
    const args = [
      '--showId',
      process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath',
      nonExistentFilePath,
      '--title',
      'Test Title',
      '--description',
      'Test Description',
      '--dryRun',
    ];

    const { stderr, code } = await runCli(args);

    expect(code).not.toBe(0);
    expect(stderr).toContain('The specified path does not exist:');
  });

  test('should perform a successful dry run with a directory path and find the newest file', async () => {
    const testDir = path.resolve(__dirname, 'temp_audio_dir');
    const oldFile = path.join(testDir, 'old_audio.mp3');
    const newFile = path.join(testDir, 'new_audio.mp3');

    fs.mkdirSync(testDir, { recursive: true });
    fs.writeFileSync(oldFile, 'old content');
    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure newFile is newer
    fs.writeFileSync(newFile, 'new content');

    const args = [
      '--showId',
      process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath',
      testDir,
      '--title',
      'Test Title Dir',
      '--description',
      'Test Description Dir',
      '--dryRun',
    ];
    const { stdout, code } = await runCli(args);

    expect(code).toBe(0);
    const output = JSON.parse(stdout);
    expect(output).toMatchObject({
      audioPath: newFile,
      title: 'Test Title Dir',
      description: 'Test Description Dir',
    });

    fs.rmSync(testDir, { recursive: true, force: true });
  });

  test('should fail if the specified --audioPath is an empty directory', async () => {
    const emptyDir = path.resolve(__dirname, 'empty_audio_dir');
    fs.mkdirSync(emptyDir, { recursive: true });

    const args = [
      '--showId',
      process.env.SPOTIFY_PODCAST_ID as string,
      '--audioPath',
      emptyDir,
      '--title',
      'Test Title Empty',
      '--description',
      'Test Description Empty',
      '--dryRun',
    ];
    const { stderr, code } = await runCli(args);

    expect(code).not.toBe(0);
    expect(stderr).toContain('No audio file found in the specified directory');

    fs.rmSync(emptyDir, { recursive: true, force: true });
  });

  test('should perform a successful dry run using a config file', async () => {
    const audioFilePath = path.resolve(__dirname, 'fixtures/test-audio.mp3');
    const config = {
      showId: process.env.SPOTIFY_PODCAST_ID as string,
      audioPath: audioFilePath,
      title: 'Config Title',
      description: 'Config Description',
      dryRun: true,
    };
    const configPath = path.resolve(__dirname, 'fixtures/config.json');
    fs.writeFileSync(configPath, JSON.stringify(config));

    const args = ['--config', configPath];
    const { stdout, code } = await runCli(args);

    expect(code).toBe(0);
    const output = JSON.parse(stdout);
    expect(output).toHaveProperty('title', 'Config Title');
    expect(output).toHaveProperty('description', 'Config Description');

    fs.unlinkSync(configPath);
  });
});
