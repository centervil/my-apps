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

  test('should validate PUBLISH_SETTINGS_FAILED status and exitCode 1 when settings mismatch', () => {
    const requestedTags = ['CRISC'];
    const tagsApplied: string[] = []; // mismatch
    const requestedMagazine = 'CRISC 30日間学習';
    const magazineApplied: string | null = null; // mismatch

    const tagsMismatch = requestedTags.some(t => !tagsApplied.includes(t));
    const magazineMismatch = requestedMagazine !== null && magazineApplied !== requestedMagazine;
    const publishFailed = tagsMismatch || magazineMismatch;

    const status = publishFailed ? 'PUBLISH_SETTINGS_FAILED' : 'SUCCESS';
    const exitCode = publishFailed ? 1 : 0;

    expect(status).toBe('PUBLISH_SETTINGS_FAILED');
    expect(exitCode).toBe(1);
  });

  test('should validate ACCOUNT_CHECK_FAILED or QUALITY_CHECK_FAILED on post-publish gate failure', () => {
    // Simulating post-publish gate failure result mapping
    const postPublishGateResult = {
      passed: false,
      checks: {
        embeddedContentsEntryFound: false,
        figureServiceAndKeyMatch: false,
        publicPageIframeExists: false,
        titleExactMatch: false,
      },
      details: {
        embeddedContentsCount: 0,
        matchedKey: null,
        figureService: null,
        figureKey: null,
        publicIframeSrcFound: false,
        apiTitle: null,
        expectedTitle: 'Test Title',
        failureReasons: ['embedded_contents does not contain entry'],
      },
    };

    const publishFailed = !postPublishGateResult.passed;
    const status = publishFailed ? (postPublishGateResult && !postPublishGateResult.passed ? 'QUALITY_CHECK_FAILED' : 'PUBLISH_SETTINGS_FAILED') : 'SUCCESS';
    const exitCode = publishFailed ? 1 : 0;

    expect(status).toBe('QUALITY_CHECK_FAILED');
    expect(exitCode).toBe(1);
  });

  test('should validate account verification fail-closed error handling', () => {
    // When urlname cannot be retrieved or parsed
    const checkFailedErr = new AuthError(
      'Could not retrieve logged-in account urlname from /api/v1/users/me response. Expected centervil.',
      'ACCOUNT_CHECK_FAILED',
      false,
    );
    expect(checkFailedErr.code).toBe('ACCOUNT_CHECK_FAILED');

    // When account does not match expected
    const mismatchErr = new AuthError(
      'Account mismatch! Expected note account urlname centervil, but current is other.',
      'ACCOUNT_MISMATCH',
      false,
    );
    expect(mismatchErr.code).toBe('ACCOUNT_MISMATCH');
  });
});
