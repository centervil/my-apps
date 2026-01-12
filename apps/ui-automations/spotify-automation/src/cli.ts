import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { runSpotifyUpload } from './features/spotifyUploader';

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
  const parser = yargs(hideBin(process.argv))
    .option('showId', {
      alias: 's',
      type: 'string',
      description: 'Spotify Show ID',
      demandOption: true,
    })
    .option('audioPath', {
      alias: 'a',
      type: 'string',
      description: 'Path to audio file or directory',
      demandOption: true,
    })
    .option('title', {
      alias: 't',
      type: 'string',
      description: 'Episode title',
      demandOption: true,
    })
    .option('description', {
      alias: 'd',
      type: 'string',
      description: 'Episode description',
      demandOption: true,
    })
    .option('season', {
      type: 'number',
      description: 'Season number',
    })
    .option('episode', {
      type: 'number',
      description: 'Episode number',
    })
    .option('dryRun', {
      type: 'boolean',
      description: 'Perform a dry run without uploading',
      default: false,
    })
    .option('config', {
      alias: 'c',
      type: 'string',
      description: 'Path to a JSON config file',
    })
    .config('config', (configPath) => {
      const resolvedPath = path.resolve(configPath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`Configuration file not found at: ${resolvedPath}`);
      }
      return JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    })
    .help()
    .strict();

  const argv = await parser.argv;

  try {
    const { showId, title, description, season, episode, dryRun } = argv;
    let { audioPath } = argv;

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
