import { type Page, type Locator } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.goto('https://playwright.dev/');
  }
}
