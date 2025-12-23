Refactor CLI entry points and consolidate logic in spotify-automation

## Background
The `spotify-automation` project currently has two conflicting entry points for the CLI:
1. `scripts/upload.ts` (invoked by `npm run upload`)
2. `src/features/spotifyUploader.ts` (invoked by `scripts/upload.sh`)

## Issues
- **Inconsistency:** `src/features/spotifyUploader.ts` supports the `--config` argument, whereas `scripts/upload.ts` does not.
- **Mixed Concerns:** `src/features/spotifyUploader.ts` mixes core upload logic with CLI argument parsing (yargs).
- **Maintenance:** Having duplicate CLI parsing logic makes the tool harder to maintain and test.

## Goals
- Consolidate CLI logic into a single entry point (e.g., `src/cli.ts`) that supports both `.env` loading and `--config` parsing.
- Refactor `src/features/spotifyUploader.ts` to be a pure library file exporting `runSpotifyUpload`, without any CLI dependencies.
- Update `scripts/upload.sh` and `package.json` to use the unified entry point.

## Tasks
- [ ] Create `src/cli.ts` (or update `scripts/upload.ts`) to handle all `yargs` parsing, `--config` loading, and `.env` setup.
- [ ] Remove `main()` function and `yargs` logic from `src/features/spotifyUploader.ts`.
- [ ] Update `scripts/upload.sh` to execute the new entry point.
- [ ] Update `package.json` scripts to execute the new entry point.
- [ ] Verify that `--config` works via `npm run upload`.
