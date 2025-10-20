import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { runSpotifyUpload } from '../src/features/spotifyUploader';

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
    .map(file => ({
      name: file,
      path: path.join(dir, file),
      stats: fs.statSync(path.join(dir, file)),
    }))
    .filter(file => file.stats.isFile())
    .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime())[0];

  return latestFile ? latestFile.path : undefined;
};

const main = async () => {
  const argv = await yargs(hideBin(process.argv))
    .option('showId', {
      alias: 's',
      type: 'string',
      description: 'ID of the Podcast show to upload to',
      demandOption: true,
    })
    .option('audioPath', {
      alias: 'a',
      type: 'string',
      description: 'Local path of the audio file to upload. If not provided, searches for the latest file in `tmp/downloads`.',
    })
    .option('title', {
      alias: 't',
      type: 'string',
      description: 'Title of the episode',
      demandOption: true,
    })
    .option('description', {
      alias: 'd',
      type: 'string',
      description: 'Description of the episode',
      demandOption: true,
    })
    .option('dryRun', {
      type: 'boolean',
      description: 'Perform a dry run without actually uploading.',
    })
    .help()
    .alias('help', 'h')
    .parse();

  try {
    const { showId, dryRun, title, description } = argv;
    let audioPath = argv.audioPath;

    // 1. Resolve Audio Path
    if (!audioPath) {
      console.log('🎧 Audio path not provided, searching for the latest file in `tmp/downloads`...');
      const fallbackDir = path.resolve(__dirname, '../../../../tmp/downloads');
      audioPath = findLatestFile(fallbackDir);

      if (!audioPath) {
        throw new Error('No audio file found in `tmp/downloads`. Please specify the audio path using the --audioPath option.');
      }
      console.log(`✅ Found audio file: ${audioPath}`);
    } else {
      audioPath = path.resolve(audioPath);
      if (!fs.existsSync(audioPath)) {
        throw new Error(`The specified audio file does not exist: ${audioPath}`);
      }
    }

    // 2. Handle Dry Run
    if (dryRun) {
      console.log('\n--- Dry Run Mode ---');
      console.log(`Show ID: ${showId}`);
      console.log(`Audio File Path: ${audioPath}`);
      console.log(`Title: ${title}`);
      console.log(`Description: ${description}`);
      console.log('Dry run would proceed with these values.');
      // Exiting gracefully for dry run
      process.exit(0);
    }

    // 3. Execute Upload
    await runSpotifyUpload({ showId, audioPath, title, description });

  } catch (error) {
    console.error('\nCLI process failed.');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
};

main();
