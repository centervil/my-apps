---
title: bug(spotify-automation): E2E test fails at "Publish Now" step despite auth fix
labels: bug, spotify-automation, e2e, ui-change
assignees: 
---

## Description
The E2E test `should attempt a real upload process` fails with a timeout at the "Publish Now" step.
Previously, a mismatch in authentication file paths was identified and fixed (forcing usage of the fresh `credentials/spotify-auth.json`). However, the test failure persists with the same error.

## Error Log
```text
[firefox] › apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts:292:7 › Spotify Automation CLI - E2E Tests › should attempt a real upload process
Real Upload Stderr: ❌ An error occurred during the Spotify upload process: locator.click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('#publish-date-now')
```

## Investigation Results
1.  **Auth Path Fixed**: The project was updated to prioritize `credentials/spotify-auth.json` (workspace root), which contains a fresh session (Jan 2, 2026), over the stale local `.auth/spotify-auth.json` (Dec 23, 2025).
2.  **Partial Success**: The automation successfully:
    -   Loads the session.
    -   Navigates to the upload wizard.
    -   Uploads the audio file (`uploadAudioFile` passes).
    -   Fills episode details (`fillEpisodeDetails` passes).
    -   Clicks "Next" (`publishEpisode` starts).
3.  **Failure Point**: The automation times out waiting for `#publish-date-now` (the "Publish Now" radio button).

## Conclusion
Since the automation can perform authenticated actions (uploading, filling details), the session is likely valid. The failure at the final step strongly suggests a **UI change** in the Spotify for Creators wizard (e.g., changed ID, new step, or different layout) that prevents the `#publish-date-now` element from being found.

## Next Steps
1.  Manually inspect the Spotify for Creators upload flow to identify the correct selectors for the "Publish" step.
2.  Update `apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts` accordingly.
