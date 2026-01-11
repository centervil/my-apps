# Audit Report: spotify-automation

**Date:** 2026-01-10
**Target:** `apps/ui-automations/spotify-automation`
**Auditor:** Gemini CLI

## 1. Overview
The `spotify-automation` project is a CLI tool for automating podcast uploads to Spotify using Playwright.
- **Status:** Functional. E2E tests are passing (10/10).
- **Test Coverage:** Good coverage for CLI argument parsing, dry runs, and basic configuration. Real upload test exists but depends on environment setup.

## 2. Key Findings & Issues

### 2.1. Critical: Authentication Path Inconsistency (Bug #143)
There is a critical bug in `scripts/saveAuth.ts` regarding the default path for saving credentials.

- **Issue:** The script uses 5 levels of `..` to resolve the workspace root, but only 4 are needed.
  - Current: `path.resolve(__dirname, '../../../../../credentials/spotify-auth.json')`
  - Correct: `path.resolve(__dirname, '../../../../credentials/spotify-auth.json')`
- **Impact:** `saveAuth.ts` attempts to save credentials to a directory *outside* the workspace root (`../credentials`), which likely fails or saves to an unexpected location.
- **Inconsistency:**
  - `saveAuth.ts` defaults to `credentials/spotify-auth.json` (broken path).
  - `README.md` states it saves to `.auth/spotify-auth.json` (project local).
  - `src/features/spotifyUploader.ts` checks:
    1. `SPOTIFY_AUTH_PATH` (Env Var)
    2. `credentials/spotify-auth.json` (Workspace Shared - Correctly resolved with 5 `..` from `src/features`)
    3. `.auth/spotify-auth.json` (Project Local)

### 2.2. Documentation Discrepancies (#132)
The `README.md` documentation is out of sync with the codebase.
- It mentions `ts-node` in commands, but the project uses `tsx` via `scripts/upload.sh`.
- It claims `saveAuth.ts` saves to `.auth/spotify-auth.json`, but the code defaults to the shared `credentials` folder.

### 2.3. CLI Robustness (#142)
`src/cli.ts` manually parses some arguments and merges them with `yargs` output in a somewhat fragile way. It should fully leverage `yargs` for validation and defaults to ensure robustness.

## 3. Improvement Proposals

### 3.1. Fix Authentication Path and Strategy
- **Fix `saveAuth.ts`:** Correct the `path.resolve` depth to 4 to correctly point to workspace `credentials/spotify-auth.json`.
- **Standardize Auth Location:** Decide on a single source of truth or clearly documented precedence.
  - **Proposal:** Default to Workspace Shared Credentials (`credentials/spotify-auth.json`) for ease of use across the monorepo, with `SPOTIFY_AUTH_PATH` as an override. Update `README.md` to reflect this.
  - Alternatively, allow `saveAuth.ts` to accept a `--local` flag to save to `.auth/` for isolated testing.

### 3.2. Update Documentation
- Update `README.md` to match the actual code behavior (using `tsx`, correct paths).
- Clarify the "dry run" vs "real run" usage in examples.

### 3.3. Refactor CLI
- Refactor `src/cli.ts` to use `yargs` strict mode and validation schema, removing manual parsing logic.

### 3.4. Enhance Tests
- Ensure `cli.spec.ts` explicitly tests the `saveAuth.ts` script (mocking the browser interaction) to verify file saving paths.

## 4. Next Actions
1.  **Prioritize:** Fix Bug #143 immediately.
2.  **Update:** Update Issue #132 with specific documentation fixes.
3.  **Plan:** Schedule refactoring for #142.
