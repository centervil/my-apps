# Requirements: Refactor CLI entry points and consolidate logic

## User Story
**As a** developer maintaining the `spotify-automation` tool,
**I want** a single, unified CLI entry point that handles configuration and argument parsing,
**So that** I can consistently use features like `--config` across all execution methods and simplify the codebase maintenance.

## Acceptance Criteria

### 1. Unified CLI Entry Point
- [ ] A new or updated entry point (e.g., `src/cli.ts` or `scripts/upload.ts`) serves as the single source of truth for CLI execution.
- [ ] This entry point handles all `yargs` argument parsing.
- [ ] This entry point handles `.env` loading using `dotenv`.
- [ ] This entry point handles `--config` loading logic.

### 2. Pure Logic Separation
- [ ] `src/features/spotifyUploader.ts` exports a function (e.g., `runSpotifyUpload`) that accepts typed options/config.
- [ ] `src/features/spotifyUploader.ts` contains **NO** direct CLI logic (no `yargs`, no `process.exit` unless for fatal errors handled gracefully, no `require.main === module` checks).

### 3. Execution Consistency
- [ ] `npm run upload` executes the unified entry point and supports `--config`.
- [ ] `scripts/upload.sh` executes the unified entry point.
- [ ] The functionality of uploading works identical to before the refactor.

### 4. Configuration Support
- [ ] Passing `--config <path>` allows loading a custom JSON configuration file, overriding defaults/env vars as per existing logic (or intended logic).
