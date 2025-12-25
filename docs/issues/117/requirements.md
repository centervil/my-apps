# Requirements - Issue 117: Real E2E Test Integration and Obsolete File Removal

## User Stories
As a developer, I want the E2E test suite to include a real upload scenario using a browser, so that I can be confident that the core functionality of the Spotify automation is working as expected. I also want to remove obsolete test files to keep the codebase clean.

## Acceptance Criteria
1.  **Real E2E Test Case**:
    - [ ] `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts` contains a test case that runs the CLI *without* the `--dryRun` flag.
    - [ ] The test case successfully triggers the `runSpotifyUpload` logic.
    - [ ] The test case uses the existing authentication session (`spotify-auth.json`).
    - [ ] The test case is skipped or handles cases where authentication is missing gracefully.
2.  **Obsolete File Removal**:
    - [ ] `apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts.skip` is removed from the repository.
3.  **Stability**:
    - [ ] The new test case does not cause hangups or timeouts in the test runner.
