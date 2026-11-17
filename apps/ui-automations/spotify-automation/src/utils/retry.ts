import { TransientError, PermanentError, AutomationError } from './errors';
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
    } catch (error: any) {
      // Determine if error is permanent / non-recoverable
      if (
        error instanceof PermanentError ||
        error instanceof AuthError ||
        error.code === 'FILE_NOT_FOUND' ||
        error.code === 'INVALID_AUTH_FILE' ||
        error.code === 'EXPIRED_AUTH' ||
        error.code === 'AUTH_EXPIRED' ||
        error.code === 'PERMANENT_ERROR' ||
        error.recoverable === false
      ) {
        throw error;
      }

      if (attempt > retries) {
        // Exceeded retries, wrap in TransientError if not already
        if (!(error instanceof TransientError)) {
          throw new TransientError(
            `Operation failed after ${retries} retries. Last error: ${error.message}`,
            'MAX_RETRIES_EXCEEDED',
          );
        }
        throw error;
      }

      onRetry(error, attempt);
      await new Promise((resolve) => setTimeout(resolve, currentDelay));
      currentDelay *= backoffFactor;
    }
  }
}
