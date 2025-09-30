import { type Page, type Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly loginButton: Locator;
  readonly loginWithPasswordButton: Locator; // For the button on the OTP screen

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('#login-username');
    this.loginButton = page.getByTestId('login-button');
    // New locator for the "Log in with password" button
    this.loginWithPasswordButton = page.getByRole('button', {
      name: 'パスワードでログイン',
    });
  }

  async goto() {
    await this.page.goto('https://accounts.spotify.com/');
  }

  async login(email: string, password: string) {
    // Step 1: Enter email and click the first login button
    await this.emailInput.fill(email);
    await this.page.waitForTimeout(500); // Add a 0.5-second delay
    await this.loginButton.click();

    // Step 2: On the OTP screen, wait for and click the "Log in with password" button
    await this.loginWithPasswordButton.waitFor({ state: 'visible' });
    await this.page.waitForTimeout(500); // Add a 0.5-second delay
    await this.loginWithPasswordButton.click();

    // Step 3: On the password screen, wait for the input, fill it, and click the final login button
    const passwordInput = this.page.locator('#login-password');
    await passwordInput.waitFor({ state: 'visible' });
    await passwordInput.fill(password);
    await this.page.waitForTimeout(500); // Add a 0.5-second delay
    await this.loginButton.click();
  }
}
