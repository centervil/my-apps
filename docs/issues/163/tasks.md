# Tasks: Fix E2E Test Configuration for Spotify Automation

- [ ] **Modify `playwright.config.ts`**
    - [ ] Open `apps/ui-automations/spotify-automation/playwright.config.ts`.
    - [ ] Locate the `projects` configuration for `firefox`.
    - [ ] Remove the project-level `testIgnore` property OR update it to include `['**/tests/unit/**']`.
        - *Preference: Try removing it first if global config covers it.*
- [ ] **Verify Fix**
    - [ ] Run `nx e2e spotify-automation` and ensure unit tests are NOT executed.
    - [ ] Ensure E2E tests ARE executed.
    - [ ] Ensure `auth.setup.ts` is ignored.
- [ ] **Commit & Push**
    - [ ] Commit with message: `chore(spotify-automation): fix e2e test configuration to exclude unit tests`.
