# Requirements - Issue 101: refactor(spotify-automation): Replace fragile selectors with robust ones using data-testid

## User Stories
As a developer, I want the UI automation to be resilient to minor UI changes on the Spotify website, so that the tests don't fail frequently due to text or CSS class changes.

## Acceptance Criteria
- [ ] Fragile selectors in `NewEpisodePage.ts` and `EpisodesPage.ts` are identified.
- [ ] Selectors are replaced with more robust alternatives, preferably `data-testid` where available, or semantic roles/labels.
- [ ] The `baseUrl` is updated to the current `creators.spotify.com` to ensure correct navigation.
- [ ] All E2E tests pass with the new selectors.
