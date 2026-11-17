export class AutomationError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false,
  ) {
    super(message);
    this.name = 'AutomationError';
  }
}

export class TransientError extends AutomationError {
  constructor(message: string, code: string = 'TRANSIENT_ERROR') {
    super(message, code, true);
    this.name = 'TransientError';
  }
}

export class PermanentError extends AutomationError {
  constructor(message: string, code: string = 'PERMANENT_ERROR') {
    super(message, code, false);
    this.name = 'PermanentError';
  }
}

export class AuthExpiredError extends PermanentError {
  constructor(message: string = 'Authentication session has expired or is invalid.') {
    super(message, 'AUTH_EXPIRED');
    this.name = 'AuthExpiredError';
  }
}
