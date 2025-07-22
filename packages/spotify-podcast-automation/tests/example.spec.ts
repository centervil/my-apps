import { test, expect } from '@playwright/test';
import { ExamplePage } from '../src/pages/examplePage';

test('should navigate to the page and check title', async ({ page }) => {
  const examplePage = new ExamplePage(page);
  await examplePage.goto();
  await expect(page).toHaveTitle(/Playwright/);
});
