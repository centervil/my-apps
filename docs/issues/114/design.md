# Design: Refactor CLI entry points and consolidate logic

## Architecture

The goal is to separate the "Interface Layer" (CLI) from the "Application Layer" (Upload Logic).

### Current State
- `scripts/upload.ts`: Entry point for `npm run upload`. Has its own logic? Or imports?
- `src/features/spotifyUploader.ts`: Contains core logic BUT also has a `main()` function with `yargs` parsing, invoked by `scripts/upload.sh`.

### Target State
- **CLI Layer**: `src/cli.ts` (new file) or repurposed `scripts/upload.ts`.
    - Responsibilities:
        - Load environment variables (`dotenv`).
        - Parse command line arguments (`yargs`).
        - specific args: `file`, `config`, etc.
        - Load configuration file if `--config` is provided.
        - Construct the `SpotifyUploadOptions` object.
        - Call the Application Layer.
        - Handle top-level errors and exit codes.
- **Application Layer**: `src/features/spotifyUploader.ts`
    - Refactored to export `runSpotifyUpload(options: SpotifyUploadOptions)`.
    - Pure function (or class) returning a Promise.
    - No direct console interaction for args, just logging.

## Components

### 1. `src/cli.ts` (New Entry Point)
We will likely move `scripts/upload.ts` logic or creating a new `src/cli.ts` and point `scripts/upload.ts` to it (or just use `ts-node src/cli.ts`).
Given the project structure, placing the source of truth in `src/cli.ts` seems appropriate.

```typescript
// Pseudo-code
import yargs from 'yargs';
import { runSpotifyUpload } from './features/spotifyUploader';

// ... config loading logic ...

const argv = yargs.option(...).argv;

runSpotifyUpload({
  filePath: argv.file,
  // ...
}).catch(err => {
  console.error(err);
  process.exit(1);
});
```

### 2. `src/features/spotifyUploader.ts`
Remove the `if (require.main === module)` block.
Export `interface SpotifyUploadOptions`.
Export `async function runSpotifyUpload(options: SpotifyUploadOptions): Promise<void>`.

### 3. `scripts/upload.sh`
Update to call `npx ts-node src/cli.ts` (or similar) instead of whatever it calls now.

### 4. `package.json`
Update `scripts.upload` to run `ts-node src/cli.ts` (or `scripts/upload.ts` which calls the core logic).

## Data Models

**SpotifyUploadOptions**
```typescript
interface SpotifyUploadOptions {
  audioFile: string;
  metadata?: {
    title?: string;
    description?: string;
    // ...
  };
  configPath?: string; // If the logic handles loading inside, or maybe resolved config is passed.
  // Ideally, the CLI resolves the config and passes the final values.
  // But if the uploader logic historically handled config loading, we might keep it there OR move it to CLI.
  // Requirement says: "Consolidate CLI logic... handling --config parsing".
  // So CLI should parse --config, load it, and pass the *values* to the uploader.
}
```

## Test Strategy

### Automated Tests
- **Unit/Integration**:
    - Import `runSpotifyUpload` in a test file.
    - Mock dependencies (Playwright, etc.) if possible, or use existing E2E structure.
    - Verify it runs without CLI args being present.
- **Manual/CLI Verification**:
    - Run `npm run upload -- --help`.
    - Run `npm run upload -- --config ./test-config.json`.
    - Verify environment variables are picked up.

## Error Handling
- The CLI script handles `process.exit`.
- The library function throws Errors.
