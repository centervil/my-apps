import { type Page, type BrowserContext, type Cookie } from '@playwright/test';
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

  public async saveAuthState(page: Page): Promise<void> {
    const cookies = await page.context().cookies();

    const localStorage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          data[key] = window.localStorage.getItem(key)!;
        }
      }
      return data;
    });

    const sessionStorage = await page.evaluate(() => {
      const data: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          data[key] = window.sessionStorage.getItem(key)!;
        }
      }
      return data;
    });

    const userAgent = await page.evaluate(() => navigator.userAgent);
    const viewport = page.viewportSize();

    const authState: AuthState = {
      cookies,
      localStorage,
      sessionStorage,
      timestamp: Date.now(),
      userAgent,
      viewport: viewport || undefined,
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
      await context.addInitScript((storage) => {
        for (const [key, value] of Object.entries(storage)) {
          window.localStorage.setItem(key, value);
        }
      }, authState.localStorage);

      await context.addInitScript((storage) => {
        for (const [key, value] of Object.entries(storage)) {
          window.sessionStorage.setItem(key, value);
        }
      }, authState.sessionStorage);

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
      if (!data.cookies || !data.localStorage || !data.timestamp) {
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
