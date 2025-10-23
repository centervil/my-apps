As part of improving the CI-friendliness of the upload script, we should remove the hardcoded `season` and `episode` placeholders in `src/features/spotifyUploader.ts`.

I recommend adding new command-line options (e.g., `--season`, `--episode`) to the `scripts/upload.ts` script to allow users to specify these values. These values should then be passed to the `runSpotifyUpload` function.

This will make the script more flexible and easier to use in automated workflows.