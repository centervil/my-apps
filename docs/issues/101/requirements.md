# Requirements for Issue #101

## User Story
As a developer maintaining the `spotify-automation` project,
I want to replace fragile selectors in `NewEpisodePage.ts` with robust `data-testid` attributes (or similar robust locators),
So that the automation scripts are less likely to break when Spotify updates their UI.

## Acceptance Criteria
1.  **Refactor `selectFileButton`**: Change selector to use `data-testid` if available, or a more robust role/attribute combination.
2.  **Refactor `titleInput`**: Change `page.locator('#title-input')` to use `data-testid` or `getByRole('textbox', { name: ... })`.
3.  **Refactor `descriptionInput`**: Change `page.locator('[contenteditable="true"]')` to a more specific locator, ideally `data-testid` or `getByRole`.
4.  **Refactor `seasonNumberInput` & `episodeNumberInput`**: Change `input[name="..."]` to `data-testid` if available.
5.  **Refactor `publishNowOption`**: Change `#publish-date-now` to `data-testid` or more semantic locator.
6.  **Refactor `inAppMessageCloseButton`**: Change `[class*="ab-iam"]` to a stable locator.
7.  **Verification**: The `NewEpisodePage` tests must pass after refactoring.