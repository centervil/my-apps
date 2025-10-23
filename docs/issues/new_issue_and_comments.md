# New Issue: test(spotify-automation): Enable and Fix E2E Tests

## Description

The E2E test suite for the `spotify-automation` project currently has two skipped tests in `tests/e2e/cli.spec.ts`:

1.  `should perform a successful dry run using the Google Drive fallback`
2.  `should fail if the specified --audioPath does not exist`

These tests should be enabled to ensure full test coverage of the CLI tool.

Additionally, the description of the first test is misleading. It refers to a "Google Drive fallback," but the implementation is a local file fallback.

## Tasks

- [ ] Remove `test.skip` from the two skipped tests in `tests/e2e/cli.spec.ts`.
- [ ] Correct the test description for the fallback mechanism to "should perform a successful dry run using the local file fallback".
- [ ] Ensure that the enabled tests run correctly and pass.

---

# Comment for Issue #71: feat(spotify-automation): Google Driveからの音声ファイルダウンロード機能を追加

I have analyzed the project and confirmed that the Google Drive integration is not yet implemented. The file `src/libs/googleDrive.ts` does not exist, and the main `scripts/upload.ts` script does not contain any Google Drive-related logic.

This issue correctly captures the need to implement this feature. The implementation should include:

1.  Creating the `src/libs/googleDrive.ts` file.
2.  Adding the necessary logic to download files from Google Drive.
3.  Integrating this functionality into the `scripts/upload.ts` script, possibly behind a new command-line flag like `--from-google-drive`.
4.  Adding E2E tests for the Google Drive integration.

---

# Comment for Issue #94: refactor(spotify-automation): Improve CI-friendliness of upload script

As part of improving the CI-friendliness of the upload script, we should remove the hardcoded `season` and `episode` placeholders in `src/features/spotifyUploader.ts`.

I recommend adding new command-line options (e.g., `--season`, `--episode`) to the `scripts/upload.ts` script to allow users to specify these values. These values should then be passed to the `runSpotifyUpload` function.

This will make the script more flexible and easier to use in automated workflows.
