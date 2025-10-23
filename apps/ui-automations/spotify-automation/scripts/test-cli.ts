import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from 'fs';

const execPromise = util.promisify(exec);

const run = async (command: string) => {
  try {
    const { stdout, stderr } = await execPromise(command);
    return { stdout, stderr, code: 0 };
  } catch (e: unknown) {
    const error = e as { stdout: string; stderr: string; code: number };
    return { stdout: error.stdout, stderr: error.stderr, code: error.code };
  }
};

const main = async () => {
  console.log('Running CLI tests...');
  let failed = false;

  // --- Setup test assets ---
  const testAssetDir = path.resolve(__dirname, 'cli_test_assets');
  const emptyDir = path.join(testAssetDir, 'empty_dir');
  const audioDir = path.join(testAssetDir, 'audio_files');
  const audioFile1 = path.join(audioDir, 'old.mp3');
  const audioFile2 = path.join(audioDir, 'newest.mp3');

  fs.mkdirSync(emptyDir, { recursive: true });
  fs.mkdirSync(audioDir, { recursive: true });
  fs.writeFileSync(audioFile1, 'dummy content');
  // Ensure newest.mp3 is newer
  await new Promise((resolve) => setTimeout(resolve, 10));
  fs.writeFileSync(audioFile2, 'dummy content');
  // --- End setup ---

  const commandBase =
    'pnpm --filter @my-apps/spotify-automation upload --title "t" --description "d"';

  const runTest = async (
    name: string,
    command: string,
    successCondition: (out: {
      stdout: string;
      stderr: string;
      code: number;
    }) => boolean,
    failureMessage: string,
  ) => {
    console.log(`\nTest: ${name}`);
    const result = await run(command);
    if (successCondition(result)) {
      console.log(`  -> Passed`);
      return false;
    } else {
      console.error(`  -> Failed: ${failureMessage}`);
      console.error(result);
      return true;
    }
  };

  // Test 1: Missing showId
  failed =
    (await runTest(
      'Should fail if showId is missing',
      `${commandBase} --audioPath ${audioFile1} --dryRun`,
      ({ code, stderr }) => code !== 0 && stderr.includes('showId'),
      'Did not error correctly for missing showId.',
    )) || failed;

  // Test 2: Missing audioPath
  failed =
    (await runTest(
      'Should fail if audioPath is missing',
      `${commandBase} --showId "test-id" --dryRun`,
      ({ code, stderr }) => code !== 0 && stderr.includes('audioPath'),
      'Did not error correctly for missing audioPath.',
    )) || failed;

  // Test 3: Invalid audioPath
  const invalidPath = 'non_existent_path/dummy.mp3';
  failed =
    (await runTest(
      'Should fail for non-existent audioPath',
      `${commandBase} --showId "test-id" --audioPath ${invalidPath} --dryRun`,
      ({ code, stderr }) => code !== 0 && stderr.includes('does not exist'),
      'Did not error correctly for invalid path.',
    )) || failed;

  // Test 4: Empty directory
  failed =
    (await runTest(
      'Should fail for an empty directory',
      `${commandBase} --showId "test-id" --audioPath ${emptyDir} --dryRun`,
      ({ code, stderr }) =>
        code !== 0 && stderr.includes('No audio file found'),
      'Did not error correctly for an empty directory.',
    )) || failed;

  // Test 5: Specific file path
  failed =
    (await runTest(
      'Should succeed with a specific file path',
      `${commandBase} --showId "test-id" --audioPath ${audioFile1} --dryRun`,
      ({ code, stdout }) => code === 0 && stdout.includes(audioFile1),
      'Did not produce correct dry run output for a specific file.',
    )) || failed;

  // Test 6: Directory path (finds newest)
  failed =
    (await runTest(
      'Should succeed with a directory path and find the newest file',
      `${commandBase} --showId "test-id" --audioPath ${audioDir} --dryRun`,
      ({ code, stdout }) => code === 0 && stdout.includes(audioFile2),
      'Did not produce correct dry run output for a directory path.',
    )) || failed;

  // --- Cleanup ---
  fs.rmSync(testAssetDir, { recursive: true, force: true });
  console.log('\nCleaned up test assets.');
  // --- End cleanup ---

  if (failed) {
    console.error('\nSome CLI tests failed.');
    process.exit(1);
  } else {
    console.log('\nAll CLI tests passed!');
  }
};

main();
