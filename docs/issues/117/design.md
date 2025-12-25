# Design - Issue 117: Real E2E Test Integration and Obsolete File Removal

## Technical Approach

### 1. Integrate Real E2E Test
The current E2E tests in `cli.spec.ts` use a `runCli` helper that spawns the `upload.sh` script. We will add a new test case that calls this helper without the `--dryRun` flag.

- **Test Name**: `should perform a real upload process (up to file upload confirmation)`
- **Logic**:
  - Use `SPOTIFY_PODCAST_ID` and a dummy or real test audio file.
  - Call `runCli` without `--dryRun`.
  - Set a generous timeout (e.g., 60 seconds) because browser operations take time.
  - Since we don't want to actually publish an episode every time the tests run, we might want to:
    - Either just verify it starts and reaches a certain point.
    - Or use a dedicated test show if available.
    - For now, the goal is to verify the *integration* of the browser logic.

### 2. Authentication Handling
The test relies on `.auth/spotify-auth.json`.
- The `globalSetup` in `playwright.config.ts` already checks for authentication validity.
- We will ensure the E2E test inherits the environment variables and paths correctly.

### 3. Cleanup
- Delete `apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts.skip`.
- Its logic is already covered by the combination of `src/features/spotifyUploader.ts` and the new CLI test.

## Verification Plan
- Run `npx nx e2e spotify-automation`.
- Confirm that the new test case starts the browser and proceeds through the upload steps.
- Confirm that the total test time is reasonable and no hangups occur.
