import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { runSpotifyUpload, SpotifyUploadOptions } from './features/spotifyUploader';

// Load .env file from the root of the monorepo
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const findLatestFile = (dir: string): string | undefined => {
  if (!fs.existsSync(dir)) {
    return undefined;
  }

  const files = fs.readdirSync(dir);
  if (files.length === 0) {
    return undefined;
  }

  const latestFile = files
    .map((file) => ({
      name: file,
      path: path.join(dir, file),
      stats: fs.statSync(path.join(dir, file)),
    }))
    .filter((file) => file.stats.isFile())
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())[0];

  return latestFile ? latestFile.path : undefined;
};

const main = async () => {
    const argv = await yargs(hideBin(process.argv))
      .option('config', {
        alias: 'c',
        type: 'string',
        description: 'Path to a JSON config file',
      })
      .argv;

  try {
    // 1. Load Config
    let uploadOptions: Partial<SpotifyUploadOptions & { dryRun?: boolean }> = {};

    if (argv.config) {
      const configPath = path.resolve(argv.config as string);
      if (!fs.existsSync(configPath)) {
        throw new Error(`Configuration file not found at: ${configPath}`);
      }
      const configContent = fs.readFileSync(configPath, 'utf-8');
      try {
        const configFromFile = JSON.parse(configContent);
        uploadOptions = { ...configFromFile };
      } catch (e) {
        throw new Error(`Failed to parse configuration file: ${(e as Error).message}`);
      }
    }

    // Merge CLI args over config (excluding undefined/null)
    // We only take values that are explicitly set in argv
    // However, yargs sets undefined for missing options unless defaults are set.
    // So we can just merge argv. But argv has extra yargs stuff ($0, _).
    // We should explicitly pick the known options.
    
    const cliOptions: Partial<typeof uploadOptions> = {};
    if (argv.showId) cliOptions.showId = argv.showId as string;
    if (argv.audioPath) cliOptions.audioPath = argv.audioPath as string;
    if (argv.title) cliOptions.title = argv.title as string;
    if (argv.description) cliOptions.description = argv.description as string;
    if (argv.season !== undefined) cliOptions.season = argv.season as number;
    if (argv.episode !== undefined) cliOptions.episode = argv.episode as number;
    if (argv.dryRun !== undefined) cliOptions.dryRun = argv.dryRun as boolean;

    uploadOptions = { ...uploadOptions, ...cliOptions };

    // Validation
    const { showId, title, description, season, episode, dryRun } = uploadOptions;
    let { audioPath } = uploadOptions;

    if (!showId || !audioPath || !title || !description) {
      // Check if we are in dryRun? Even in dryRun we might want to validate required fields exist.
      // But maybe not all?
      // Let's enforce them.
      throw new Error('Missing required arguments: showId, audioPath, title, description');
    }

    // 2. Resolve Audio Path
    const resolvedAudioPath = path.resolve(audioPath);

    if (!fs.existsSync(resolvedAudioPath)) {
      throw new Error(`The specified path does not exist: ${resolvedAudioPath}`);
    }

    const stats = fs.statSync(resolvedAudioPath);

    if (stats.isDirectory()) {
      console.log(
        `🎧 Path is a directory, searching for the latest file in \
${resolvedAudioPath}\
...`,
      );
      const latestFile = findLatestFile(resolvedAudioPath);
      if (!latestFile) {
        throw new Error(
          `No audio file found in the specified directory: ${resolvedAudioPath}`,
        );
      }
      audioPath = latestFile;
      console.log(`✅ Found audio file: ${audioPath}`);
    } else if (!stats.isFile()) {
      throw new Error(
        `The specified path is not a file or directory: ${resolvedAudioPath}`,
      );
    } else {
        audioPath = resolvedAudioPath;
    }

    // 3. Handle Dry Run
    if (dryRun) {
      console.log('--- DRY RUN ---');
      console.log(
        JSON.stringify(
          {
            showId,
            audioPath,
            title,
            description,
            season,
            episode,
          },
          null,
          2,
        ),
      );
      process.exit(0);
    }

    // 4. Execute Upload
    await runSpotifyUpload({
      showId: showId as string,
      audioPath: audioPath as string,
      title: title as string,
      description: description as string,
      season: season as number,
      episode: episode as number,
    });
  } catch (error) {
    console.error('\n❌ CLI process failed.');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
};

main();
