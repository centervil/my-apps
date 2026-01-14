import { test, expect } from '@playwright/test';
import { getSpotifyAuthPath, ensureAuthDir, getScreenshotPath } from '../../src/utils/paths';
import path from 'path';
import os from 'os';
import fs from 'fs';

test.describe('paths utils', () => {
  const originalEnv = process.env;

  test.beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.SPOTIFY_AUTH_PATH;
  });

  test.afterEach(() => {
    process.env = originalEnv;
  });

  test.describe('getSpotifyAuthPath', () => {
    test('should return path from SPOTIFY_AUTH_PATH if set', () => {
      const customPath = '/tmp/custom/path.json';
      process.env.SPOTIFY_AUTH_PATH = customPath;
      expect(getSpotifyAuthPath()).toBe(customPath);
    });

    test('should resolve relative SPOTIFY_AUTH_PATH to absolute', () => {
      process.env.SPOTIFY_AUTH_PATH = './relative/path.json';
      const resolved = getSpotifyAuthPath();
      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toBe(path.resolve('./relative/path.json'));
    });

    test('should return default path if SPOTIFY_AUTH_PATH is not set', () => {
      const expectedPath = path.join(os.homedir(), '.my-apps/credentials/spotify-auth.json');
      expect(getSpotifyAuthPath()).toBe(expectedPath);
    });
  });

  test.describe('ensureAuthDir', () => {
    test('should create directory if it does not exist', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-test-'));
      const authFile = path.join(tempDir, 'subdir', 'auth.json');

      try {
        ensureAuthDir(authFile);
        expect(fs.existsSync(path.dirname(authFile))).toBe(true);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    test('should not throw if directory already exists', () => {
      const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auth-test-existing-'));
      const authFile = path.join(tempDir, 'auth.json');

      try {
        ensureAuthDir(authFile); // Should create it
        ensureAuthDir(authFile); // Should be fine calling again
        expect(fs.existsSync(tempDir)).toBe(true);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  test.describe('getScreenshotPath', () => {
    test('should use SPOTIFY_AUTOMATION_OUTPUT_DIR if set', () => {
      const customDir = path.resolve(os.tmpdir(), 'custom-screens-' + Date.now());
      process.env.SPOTIFY_AUTOMATION_OUTPUT_DIR = customDir;

      try {
        const screenshotPath = getScreenshotPath();
        expect(path.dirname(screenshotPath)).toBe(customDir);
        // Check filename format: error-YYYY-MM-DDTHH-mm-ss-mssZ.png
        // Simplified regex check
        expect(path.basename(screenshotPath)).toMatch(/^error-.*\.png$/);
        expect(fs.existsSync(customDir)).toBe(true);
      } finally {
        if (fs.existsSync(customDir)) fs.rmSync(customDir, { recursive: true, force: true });
      }
    });

    test('should use default dist path if env var is not set', () => {
      const screenshotPath = getScreenshotPath();
      const expectedDir = path.resolve(process.cwd(), 'dist/apps/ui-automations/spotify-automation/screenshots');
      expect(path.dirname(screenshotPath)).toBe(expectedDir);
    });

    test('should create the directory if it does not exist', () => {
      const tempDir = path.resolve(os.tmpdir(), 'test-screenshot-creation-' + Date.now());
      process.env.SPOTIFY_AUTOMATION_OUTPUT_DIR = tempDir;

      if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });

      try {
        getScreenshotPath();
        expect(fs.existsSync(tempDir)).toBe(true);
      } finally {
        if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });
});
