import { TransientError } from './errors';
import { AuthError } from '../auth/authErrors';

export interface RetryOptions {
  retries?: number;
  delayMs?: number;
  backoffFactor?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    retries = 3,
    delayMs = 1000,
    backoffFactor = 2,
    onRetry = () => {},
  } = options;

  let attempt = 0;
  let currentDelay = delayMs;

  while (true) {
    try {
      attempt++;
      return await fn();
    } catch (error: unknown) {
      const err = error as Record<string, unknown>;
      // Determine if error is permanent / non-recoverable
      if (
        err.name === 'PermanentError' ||
        error instanceof AuthError ||
        err.code === 'FILE_NOT_FOUND' ||
        err.code === 'INVALID_AUTH_FILE' ||
        err.code === 'EXPIRED_AUTH' ||
        err.code === 'AUTH_EXPIRED' ||
        err.code === 'PERMANENT_ERROR' ||
        err.recoverable === false
      ) {
        throw error;
      }

      if (attempt > retries) {
        // Exceeded retries, wrap in TransientError if not already
        if (!(error instanceof TransientError)) {
          throw new TransientError(
            `Operation failed after ${retries} retries. Last error: ${error instanceof Error ? error.message : String(error)}`,
            'MAX_RETRIES_EXCEEDED',
          );
        }
        throw error;
      }

      onRetry(error as Error, attempt);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffFactor;
    }
  }
}

