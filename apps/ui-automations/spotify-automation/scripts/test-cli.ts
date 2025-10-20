import { exec } from 'child_process';
import util from 'util';
import path from 'path';

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

  const commandBase = 'pnpm --filter @my-apps/spotify-automation upload';

  // Test 1: Missing showId
  console.log('\nTest 1: Should fail if showId is missing');
  const { stderr: stderr1, code: code1 } = await run(`${commandBase} --dry-run`);
  if (code1 === 0 || !stderr1.includes('showId')) {
    console.error('Test 1 Failed: Did not error correctly for missing showId.');
    console.error({ stderr1, code1 });
    failed = true;
  } else {
    console.log('Test 1 Passed');
  }

  // Test 2: With specific audioPath
  console.log('\nTest 2: Should succeed with specific audioPath');
  const specificAudioPath = 'path/to/dummy.mp3';
  const { stdout: stdout2, code: code2 } = await run(`${commandBase} --showId "test-id" --audioPath "${specificAudioPath}" --dry-run`);
  const expectedPath = path.resolve(specificAudioPath);
  if (code2 !== 0 || !stdout2.includes('"showId": "test-id"') || !stdout2.includes(`"audioPath": "${expectedPath}"`)) {
    console.error('Test 2 Failed: Did not produce correct dry run output for specific path.');
    console.error({ stdout2, code2 });
    failed = true;
  } else {
    console.log('Test 2 Passed');
  }

  // Test 3: Fallback to latest file
  console.log('\nTest 3: Should fall back to the latest file in tmp/downloads');
  const { stdout: stdout3, code: code3 } = await run(`${commandBase} --showId "test-id" --dry-run`);
  const expectedFallbackPath = path.resolve(process.cwd(), '../../..', 'tmp/downloads/newest.mp3');
  if (code3 !== 0 || !stdout3.includes('"showId": "test-id"') || !stdout3.includes(`"audioPath": "${expectedFallbackPath}"`)) {
    console.error('Test 3 Failed: Did not produce correct dry run output for fallback path.');
    console.error({ stdout3, code3 });
    failed = true;
  } else {
    console.log('Test 3 Passed');
  }

  // Cleanup
  // Note: The dummy files are not removed automatically. This could be added here.

  if (failed) {
    console.error('\nSome tests failed.');
    process.exit(1);
  } else {
    console.log('\nAll tests passed!');
  }
};

main();
