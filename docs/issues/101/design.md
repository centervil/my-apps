# Design - Issue 101: refactor(spotify-automation): Replace fragile selectors with robust ones using data-testid

## Implementation Plan

### 1. Update Navigation URL
- Change `baseUrl` from `https://podcasters.spotify.com` to `https://creators.spotify.com` in `spotifyUploader.ts`.

### 2. Refactor `NewEpisodePage.ts`
- **Select File Button**:
  - Current: `page.locator('button', { hasText: 'Select a file' })`
  - Proposed: Use `getByRole('button', { name: /select a file/i })` or a specific test ID if found.
- **Title/Description**:
  - Use `getByLabel` or `getByPlaceholder` which are more descriptive than generic textboxes with names.
- **Other elements**: Review `privacyBannerCloseButton`, `nextButton`, `publishButton`, etc.

### 3. Refactor `EpisodesPage.ts`
- Replace the pulsating line CSS selector `.indexstyled__PulsatingLine-sc-15ud9mm-0` with a more stable way to wait for the page to load (e.g., `waitForLoadState('networkidle')` or waiting for a specific container element).

### 4. Verification
- Use `playwright codegen` or manual inspection to find the most stable locators.
- Run tests in `--headed` mode if possible to confirm the flow.
