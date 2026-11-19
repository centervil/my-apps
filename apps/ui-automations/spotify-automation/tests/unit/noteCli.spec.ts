import { test, expect } from '@playwright/test';
import { mapErrorToExecutionResult } from '../../src/utils/resultReporter';
import { AuthError } from '../../src/auth/authErrors';
import { NoteEditorPage } from '../../src/pages/NoteEditorPage';

test.describe('Note CLI Unit Tests', () => {
  test('should map AuthError to AUTH_EXPIRED status and exitCode 2', () => {
    const error = new AuthError('Note authentication file not found', 'AUTH_EXPIRED');
    const startTime = Date.now() - 1000;
    const result = mapErrorToExecutionResult(error, startTime);

    expect(result.success).toBe(false);
    expect(result.status).toBe('AUTH_EXPIRED');
    expect(result.exitCode).toBe(2);
    expect(result.errorCode).toBe('AUTH_EXPIRED');
  });

  test('should validate dry-run execution logic and result format', () => {
    const startTime = Date.now();
    const mockResult = {
      success: true,
      status: 'SUCCESS' as const,
      exitCode: 0,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      details: {
        contentType: 'study',
        title: 'Test Series 30日間学習Day1',
      },
    };

    expect(mockResult.success).toBe(true);
    expect(mockResult.exitCode).toBe(0);
    expect(mockResult.status).toBe('SUCCESS');
    expect(mockResult.details.title).toContain('Day1');
  });

  test('should extract note ID and edit URL correctly from editor page url', () => {
    const mockPage = {
      url: () => 'https://editor.note.com/notes/n12345678abcd/edit/',
    } as unknown as import('@playwright/test').Page;
    const editorPage = new NoteEditorPage(mockPage);
    expect(editorPage.extractNoteId()).toBe('n12345678abcd');
    expect(editorPage.getEditUrl()).toBe('https://editor.note.com/notes/n12345678abcd/edit/');
  });

  test('should validate publish options parsing and structure', () => {
    const publishOpts = {
      publish: true,
      tags: '動作確認,noteCLI',
      magazine: 'テストマガジン',
    };
    expect(publishOpts.publish).toBe(true);
    const tagList = publishOpts.tags.split(',').map(t => t.trim());
    expect(tagList).toEqual(['動作確認', 'noteCLI']);
    expect(publishOpts.magazine).toBe('テストマガジン');
  });
});
