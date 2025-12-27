# Design for Issue #101

## Architecture
This change involves refactoring the `NewEpisodePage` class within the Page Object Model (POM) structure. No architectural changes are required.

## Implementation Details

### Target File
`apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts`

### Proposed Selector Changes

We will prioritize using `data-testid` attributes as requested. If not available (since we are automating a 3rd party site), we will use the most robust standard Playwright locators (Role-based locators) that are less brittle than CSS classes or IDs.

*   **`selectFileButton`**:
    *   Current: `page.getByRole('button').filter({ hasText: /select a file/i }).first()`
    *   New: `page.getByTestId('select-file-button')` (if valid) or `page.getByRole('button', { name: 'Select a file' })`

*   **`titleInput`**:
    *   Current: `page.locator('#title-input')`
    *   New: `page.getByTestId('episode-title')` or `page.getByRole('textbox', { name: 'Title' })`

*   **`descriptionInput`**:
    *   Current: `page.locator('[contenteditable="true"]')`
    *   New: `page.getByTestId('episode-description')` or `page.getByRole('textbox', { name: 'Description' })`

*   **`seasonNumberInput`**:
    *   Current: `page.locator('input[name="podcastSeasonNumber"]')`
    *   New: `page.getByTestId('season-number')`

*   **`episodeNumberInput`**:
    *   Current: `page.locator('input[name="podcastEpisodeNumber"]')`
    *   New: `page.getByTestId('episode-number')`

*   **`publishNowOption`**:
    *   Current: `page.locator('#publish-date-now')`
    *   New: `page.getByTestId('publish-now')` or `page.getByLabel('Publish now')`

*   **`inAppMessageCloseButton`**:
    *   Current: `page.locator('[class*="ab-iam"]').getByRole('button').first()`
    *   New: `page.getByTestId('close-iam-button')` or `page.getByRole('button', { name: 'Close' })`

## Test Strategy
1.  Run existing tests (`tests/spotify-new-episode.spec.ts` or similar) to ensure baseline pass.
2.  Modify selectors in `NewEpisodePage.ts` one by one.
3.  Run tests after each change to verify the new selector works (assuming the site hasn't changed, the test should pass if the new selector is correct).