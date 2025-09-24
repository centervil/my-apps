export type AuthErrorCode =
  | 'FILE_NOT_FOUND'
  | 'INVALID_AUTH_FILE'
  | 'EXPIRED_AUTH'
  | 'NETWORK_ERROR'
  | 'PERMISSION_DENIED';

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ErrorHandler {
  static handleAuthError(error: AuthError): void {
    console.error(`[AuthError] ${error.message} (Code: ${error.code})`);
    
    switch (error.code) {
      case 'FILE_NOT_FOUND':
        console.info('Authentication file not found. Please run the `saveAuth.ts` script to create it.');
        break;
      case 'INVALID_AUTH_FILE':
        console.info('The authentication file is corrupted or invalid. Please run `saveAuth.ts` again.');
        break;
      case 'EXPIRED_AUTH':
        console.info('Authentication has expired. Please run `saveAuth.ts` to refresh your session.');
        break;
      case 'PERMISSION_DENIED':
        console.error('Permission denied while accessing the authentication file.');
        break;
      default:
        console.error('An unexpected authentication error occurred.');
        break;
    }

    if (!error.recoverable) {
        console.error('This is a non-recoverable error. Exiting.');
        process.exit(1);
    }
  }
}
