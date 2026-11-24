import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  loadDeletionWhitelist,
  isNoteDeletionAllowed,
  assertNoteDeletionAllowed,
} from '../../src/utils/noteWhitelist';

test.describe('Note Deletion Whitelist Unit Tests', () => {
  const originalEnv = process.env;

  test.beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NOTE_DELETION_WHITELIST;
    delete process.env.NOTE_DELETION_WHITELIST_PATH;
  });

  test.afterEach(() => {
    process.env = originalEnv;
  });

  test('should return empty list (fail-closed) when whitelist file does not exist and env var is empty', () => {
    process.env.NOTE_DELETION_WHITELIST_PATH = '/path/to/nonexistent/file.json';
    const list = loadDeletionWhitelist();
    expect(list).toEqual([]);
    expect(isNoteDeletionAllowed('n12345678abcd')).toBe(false);
  });

  test('should load whitelist from JSON array file when present', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whitelist-test-'));
    const tempFile = path.join(tempDir, 'whitelist.json');
    fs.writeFileSync(tempFile, JSON.stringify(['n_test_1', 'n_test_2', '  n_test_3  ']));

    try {
      const list = loadDeletionWhitelist(tempFile);
      expect(list).toEqual(['n_test_1', 'n_test_2', 'n_test_3']);
      expect(isNoteDeletionAllowed('n_test_1', list)).toBe(true);
      expect(isNoteDeletionAllowed('n_test_2', list)).toBe(true);
      expect(isNoteDeletionAllowed('n_test_3', list)).toBe(true);
      expect(isNoteDeletionAllowed('n_other', list)).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should load whitelist from environment variable NOTE_DELETION_WHITELIST', () => {
    process.env.NOTE_DELETION_WHITELIST = 'n_env_1, n_env_2,n_env_3';
    process.env.NOTE_DELETION_WHITELIST_PATH = '/path/to/nonexistent.json';

    const list = loadDeletionWhitelist();
    expect(list).toEqual(['n_env_1', 'n_env_2', 'n_env_3']);
    expect(isNoteDeletionAllowed('n_env_1')).toBe(true);
    expect(isNoteDeletionAllowed('n_env_4')).toBe(false);
  });

  test('should combine or prioritize env var and file correctly', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whitelist-test-'));
    const tempFile = path.join(tempDir, 'whitelist.json');
    fs.writeFileSync(tempFile, JSON.stringify(['n_file_1']));
    process.env.NOTE_DELETION_WHITELIST = 'n_env_1';
    process.env.NOTE_DELETION_WHITELIST_PATH = tempFile;

    try {
      const list = loadDeletionWhitelist();
      expect(list).toContain('n_file_1');
      expect(list).toContain('n_env_1');
      expect(isNoteDeletionAllowed('n_file_1')).toBe(true);
      expect(isNoteDeletionAllowed('n_env_1')).toBe(true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('should handle invalid JSON file gracefully with fail-closed behavior', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'whitelist-test-'));
    const tempFile = path.join(tempDir, 'invalid.json');
    fs.writeFileSync(tempFile, 'not valid json {{{');

    try {
      const list = loadDeletionWhitelist(tempFile);
      expect(list).toEqual([]);
      expect(isNoteDeletionAllowed('n_test', list)).toBe(false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('assertNoteDeletionAllowed throws AuthError with DELETE_NOT_ALLOWED when key is not allowed', () => {
    expect(() => assertNoteDeletionAllowed('n_unauthorized', ['n_authorized'])).toThrowError(/DELETE_NOT_ALLOWED/);
    try {
      assertNoteDeletionAllowed('n_unauthorized', ['n_authorized']);
    } catch (e: unknown) {
      expect((e as { code?: string }).code).toBe('DELETE_NOT_ALLOWED');
    }
  });

  test('assertNoteDeletionAllowed does not throw when key is allowed', () => {
    expect(() => assertNoteDeletionAllowed('n_authorized', ['n_authorized'])).not.toThrow();
  });

  test('NoteEditorPage.deleteNote rejects unwhitelisted noteId immediately before any navigation', async () => {
    // Dummy Page object to verify deleteNote rejects without touching page
    let navigated = false;
    const dummyPage = {
      goto: async () => {
        navigated = true;
      },
      request: {
        get: async () => {
          navigated = true;
          return { ok: () => false };
        },
      },
    } as unknown as import('@playwright/test').Page;

    const editorPage = new (await import('../../src/pages/NoteEditorPage')).NoteEditorPage(dummyPage);

    // With empty whitelist
    process.env.NOTE_DELETION_WHITELIST = '';
    process.env.NOTE_DELETION_WHITELIST_PATH = '/path/to/nonexistent.json';

    await expect(editorPage.deleteNote('n_unauthorized')).rejects.toThrowError(/DELETE_NOT_ALLOWED/);
    expect(navigated).toBe(false);
  });
});
