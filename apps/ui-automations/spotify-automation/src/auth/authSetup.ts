import { type BrowserContext } from '@playwright/test';
import { AuthManager } from './authManager';
import { AuthError, ErrorHandler } from './authErrors';

export class AuthSetup {
  /**
   * Loads authentication state into the browser context.
   * Throws an error if the authentication is not valid.
   */
  static async setupAuthentication(
    context: BrowserContext,
    authManager: AuthManager,
  ): Promise<void> {
    const success = await authManager.loadAuthState(context);
    if (!success) {
      // Error is already handled in loadAuthState, but we throw
      // to stop the execution flow if loading fails.
      throw new AuthError(
        'Authentication setup failed. Please run the saveAuth script.',
        'INVALID_AUTH_FILE',
        false, // Non-recoverable for this test run
      );
    }
  }

  /**
   * Checks if the authentication is valid without loading it.
   * This is useful for global setup checks.
   */
  static async requireAuthentication(authManager: AuthManager): Promise<void> {
    try {
      await authManager.isAuthValid();
      console.log('Authentication state is valid.');
    } catch (error) {
      if (error instanceof AuthError) {
        ErrorHandler.handleAuthError(error);
        // Throw again to fail the global setup and prevent tests from running.
        throw error;
      }
      console.error(
        'An unexpected error occurred during authentication check:',
        error,
      );
      throw new AuthError(
        'An unexpected error occurred during authentication check.',
        'INVALID_AUTH_FILE',
        false,
      );
    }
  }
}
