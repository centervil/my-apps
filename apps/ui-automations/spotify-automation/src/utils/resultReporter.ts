import * as fs from 'fs/promises';
import * as path from 'path';

export type ExecutionStatus =
  | 'SUCCESS'
  | 'AUTH_EXPIRED'
  | 'TRANSIENT_FAILURE'
  | 'PERMANENT_FAILURE'
  | 'VALIDATION_ERROR'
  | 'QUALITY_CHECK_FAILED'
  | 'PUBLISH_SETTINGS_FAILED'
  | 'UNKNOWN_ERROR';

export interface ExecutionResult {
  success: boolean;
  status: ExecutionStatus;
  exitCode: number;
  errorCode?: string;
  message?: string;
  timestamp: string;
  durationMs: number;
  details?: Record<string, unknown>;
}

export async function saveExecutionResult(
  result: ExecutionResult,
  outputPath?: string,
): Promise<string> {
  const resolvedPath =
    outputPath || path.resolve(process.cwd(), 'spotify-automation-result.json');
  try {
    await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
    await fs.writeFile(resolvedPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`📄 Execution result saved to ${resolvedPath}`);
  } catch (err) {
    console.error(`Failed to save execution result JSON:`, err);
  }
  return resolvedPath;
}

export function mapErrorToExecutionResult(
  error: unknown,
  startTime: number,
): ExecutionResult {
  const durationMs = Date.now() - startTime;
  const timestamp = new Date().toISOString();

  const err = error as Record<string, unknown>;
  let status: ExecutionStatus = 'UNKNOWN_ERROR';
  let exitCode = 1;
  let errorCode = (err.code as string) || 'UNKNOWN';
  const message = (err.message as string) || String(error);

  if (
    error instanceof Error &&
    (error.name === 'AuthExpiredError' ||
     error.name === 'AuthError' ||
     err.code === 'EXPIRED_AUTH' ||
     err.code === 'AUTH_EXPIRED' ||
     errorCode === 'EXPIRED_AUTH' ||
     errorCode === 'AUTH_EXPIRED')
  ) {
    status = 'AUTH_EXPIRED';
    exitCode = 2;
    errorCode = errorCode === 'UNKNOWN' ? 'AUTH_EXPIRED' : errorCode;
  } else if (err.name === 'TransientError' || err.code === 'MAX_RETRIES_EXCEEDED') {
    status = 'TRANSIENT_FAILURE';
    exitCode = 3;
  } else if (
    err.name === 'PermanentError' ||
    err.code === 'FILE_NOT_FOUND' ||
    err.code === 'INVALID_AUTH_FILE'
  ) {
    status = 'PERMANENT_FAILURE';
    exitCode = 1;
  } else if (
    message.includes('Missing required argument') ||
    message.includes('does not exist')
  ) {
    status = 'VALIDATION_ERROR';
    exitCode = 1;
  }

  return {
    success: false,
    status,
    exitCode,
    errorCode,
    message,
    timestamp,
    durationMs,
    details: (err.details as Record<string, unknown>) || {},
  };
}

