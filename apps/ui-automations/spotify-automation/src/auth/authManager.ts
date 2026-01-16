import { type BrowserContext, type Cookie } from '@playwright/test';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AuthError, ErrorHandler } from './authErrors';

export interface AuthState {
  cookies: Cookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: number;
  expiresAt?: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export class AuthManager {
  private authFilePath: string;

  constructor(authFilePath: string) {
    this.authFilePath = authFilePath;
  }

  public async saveAuthState(context: BrowserContext): Promise<void> {
    const cookies = await context.cookies();
    const pages = context.pages();
    
    let localStorage: Record<string, string> = {};
    let sessionStorage: Record<string, string> = {};

    if (pages.length > 0) {
      const page = pages[0];
      const storage = await page.evaluate(() => {
        return {
          localStorage: { ...window.localStorage },
          sessionStorage: { ...window.sessionStorage },
        };
      });
      localStorage = storage.localStorage;
      sessionStorage = storage.sessionStorage;
    }

    const authState: Partial<AuthState> = {
      cookies,
      localStorage,
      sessionStorage,
      timestamp: Date.now(),
    };

    try {
      await fs.mkdir(path.dirname(this.authFilePath), { recursive: true });
      await fs.writeFile(this.authFilePath, JSON.stringify(authState, null, 2));
    } catch (error) {
      console.error(
        `Failed to save authentication state to ${this.authFilePath}`,
        error,
      );
      throw error;
    }
  }

  public async loadAuthState(context: BrowserContext): Promise<boolean> {
    try {
      await this.isAuthValid();
    } catch (error) {
      if (error instanceof AuthError) {
        ErrorHandler.handleAuthError(error);
      } else {
        console.error(
          'An unexpected error occurred during auth validation:',
          error,
        );
      }
      return false;
    }

    try {
      const content = await fs.readFile(this.authFilePath, 'utf-8');
      const authState: AuthState = JSON.parse(content);

      await context.addCookies(authState.cookies);

      const pages = context.pages();
      if (pages.length > 0) {
        const page = pages[0];
        await page.evaluate((data) => {
          if (data.localStorage) {
            Object.entries(data.localStorage).forEach(([key, value]) => {
              window.localStorage.setItem(key, value as string);
            });
          }
          if (data.sessionStorage) {
            Object.entries(data.sessionStorage).forEach(([key, value]) => {
              window.sessionStorage.setItem(key, value as string);
            });
          }
        }, { localStorage: authState.localStorage, sessionStorage: authState.sessionStorage });
      }

      console.log('Successfully loaded authentication state.');
      return true;
    } catch {
      const authError = new AuthError(
        'Failed to load authentication state into browser context.',
        'INVALID_AUTH_FILE',
      );
      ErrorHandler.handleAuthError(authError);
      return false;
    }
  }

  public async isAuthValid(maxAgeHours: number = 720): Promise<boolean> {
    const fileIsValid = await this.validateAuthFile();
    if (!fileIsValid) {
      return false;
    }

    try {
      const content = await fs.readFile(this.authFilePath, 'utf-8');
      const authState: AuthState = JSON.parse(content);

      const authAgeHours =
        (Date.now() - authState.timestamp) / (1000 * 60 * 60);
      if (authAgeHours > maxAgeHours) {
        throw new AuthError(
          `Authentication is older than ${maxAgeHours} hours.`,
          'EXPIRED_AUTH',
        );
      }

      // Check for expired cookies
      const now = Date.now();
      for (const cookie of authState.cookies) {
        if (cookie.expires && cookie.expires !== -1 && cookie.expires * 1000 < now) {
          console.warn(`[WARN] Cookie '${cookie.name}' has expired and will be ignored.`);
        }
      }

      return true;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError(
        'Failed to read or parse the authentication file.',
        'INVALID_AUTH_FILE',
      );
    }
  }

  private async validateAuthFile(): Promise<boolean> {
    try {
      await fs.access(this.authFilePath, fs.constants.R_OK);
    } catch {
      throw new AuthError(
        `Authentication file not found or not readable at ${this.authFilePath}`,
        'FILE_NOT_FOUND',
      );
    }

    try {
      const content = await fs.readFile(this.authFilePath, 'utf-8');
      const data = JSON.parse(content);
      if (!data.cookies || !data.timestamp) {
        throw new Error('Missing essential properties in auth file.');
      }
      return true;
    } catch {
      throw new AuthError(
        'Authentication file is corrupted or improperly formatted.',
        'INVALID_AUTH_FILE',
      );
    }
  }
}
