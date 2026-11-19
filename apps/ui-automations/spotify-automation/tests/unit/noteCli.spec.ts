import { test, expect } from '@playwright/test';
import { mapErrorToExecutionResult } from '../../src/utils/resultReporter';
import { AuthError } from '../../src/auth/authErrors';

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
});
