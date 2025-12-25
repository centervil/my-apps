# Tasks - Issue 117: Real E2E Test Integration and Obsolete File Removal

## 1. Preparation
- [ ] Verify current state of `cli.spec.ts` and `newEpisode.spec.ts.skip`.
- [ ] Confirm `spotify-auth.json` is available or valid for local testing.

## 2. Implementation
- [ ] Add a "real upload" test case to `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts`.
- [ ] Configure the test to run without `--dryRun` and with an appropriate timeout.
- [ ] Add environment variable checks to skip the test if mandatory credentials or session files are missing.

## 3. Cleanup
- [ ] Delete `apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts.skip`.

## 4. Verification
- [ ] Run `nx e2e spotify-automation` and ensure all tests (including the new one) pass or are skipped correctly.
- [ ] Verify that the browser is actually launched during the real upload test (if running in headed mode or by checking logs).
