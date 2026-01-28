# Requirements: Fix E2E Test Configuration for Spotify Automation

## 1. User Stories

- **As a** Developer (開発者)
- **I want to** ensure that `nx e2e spotify-automation` only runs E2E tests and excludes unit tests
- **So that** I can run the E2E test suite efficiently without unnecessary noise or delays from unit tests.

## 2. Acceptance Criteria

- [ ] **Exclusion of Unit Tests**: When running the E2E test command (`nx e2e spotify-automation`), files located in `apps/ui-automations/spotify-automation/tests/unit` must NOT be executed.
- [ ] **Execution of E2E Tests**: The existing E2E tests (located in `tests/e2e` or similar) must still be executed correctly.
- [ ] **Configuration Correctness**: The `playwright.config.ts` file must be configured to correctly ignore unit tests, resolving the issue where project-level settings were overriding the global `testIgnore` pattern improperly.
