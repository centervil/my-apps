import * as fs from 'fs';
import * as path from 'path';
import { AuthError } from '../auth/authErrors';

export const NOTE_DELETION_WHITELIST_PATH = path.resolve(
  __dirname,
  '../../../../../credentials/note-deletion-whitelist.json',
);

/**
 * Loads the deletion whitelist keys from file (credentials/note-deletion-whitelist.json)
 * and/or environment variable (NOTE_DELETION_WHITELIST).
 * Returns an array of authorized note key strings.
 * If neither source contains authorized keys, returns an empty array (fail-closed).
 */
export function loadDeletionWhitelist(customFilePath?: string): string[] {
  const allowedKeys = new Set<string>();

  // 1. Load from environment variable (comma-separated keys)
  const envWhitelist = process.env.NOTE_DELETION_WHITELIST;
  if (envWhitelist && envWhitelist.trim()) {
    envWhitelist
      .split(',')
      .map(k => k.trim())
      .filter(Boolean)
      .forEach(k => allowedKeys.add(k));
  }

  // 2. Load from JSON file
  const filePath = customFilePath || process.env.NOTE_DELETION_WHITELIST_PATH || NOTE_DELETION_WHITELIST_PATH;
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        parsed
          .map(item => (typeof item === 'string' ? item.trim() : ''))
          .filter(Boolean)
          .forEach(k => allowedKeys.add(k));
      } else {
        console.warn(`[Whitelist] Whitelist file at ${filePath} is not a JSON array. Ignoring.`);
      }
    } catch (err) {
      console.warn(`[Whitelist] Failed to parse whitelist file at ${filePath}:`, err);
    }
  }

  return Array.from(allowedKeys);
}

/**
 * Pure check function: returns true if noteId is present in allowedKeys (or loaded whitelist).
 */
export function isNoteDeletionAllowed(noteId: string, allowedKeys?: string[]): boolean {
  if (!noteId || !noteId.trim()) {
    return false;
  }
  const keys = allowedKeys !== undefined ? allowedKeys : loadDeletionWhitelist();
  return keys.includes(noteId.trim());
}

/**
 * Asserts noteId is allowed for deletion. Throws AuthError('DELETE_NOT_ALLOWED') if not allowed.
 */
export function assertNoteDeletionAllowed(noteId: string, allowedKeys?: string[]): void {
  if (!isNoteDeletionAllowed(noteId, allowedKeys)) {
    throw new AuthError(
      `DELETE_NOT_ALLOWED: Deletion not allowed for note ID '${noteId}'. It is not listed in the deletion whitelist.`,
      'DELETE_NOT_ALLOWED',
      false,
    );
  }
}
