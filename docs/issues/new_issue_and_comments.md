# Fix Playwright Setup and Nx Targets

## Current Status
- The `spotify-automation` project lacks a configured `e2e` target in `project.json`.
- Playwright browsers are missing in the environment, causing `runSpotifyUpload` and E2E tests to fail.
- The `collect-audit-context.ts` script fails to run due to `ts-node` configuration issues.

## Issues
1. **Missing E2E Target**: `nx e2e spotify-automation` fails because the target is undefined.
2. **Missing Browsers**: `npx playwright test` fails with "Executable doesn't exist".
3. **Script Execution**: `collect-audit-context.ts` fails with unknown file extension error.

## Recommendations
- Add an `e2e` target to `apps/ui-automations/spotify-automation/project.json`.
- Ensure `npx playwright install` is run in the CI/CD pipeline and locally.
- Fix `ts-node` configuration or use `tsx` for running scripts.