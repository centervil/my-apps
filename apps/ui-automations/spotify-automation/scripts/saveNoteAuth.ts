import { firefox } from '@playwright/test';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { AuthManager } from '../src/auth/authManager';
import { getNoteAuthPath } from '../src/utils/paths';

const defaultAuthFilePath = getNoteAuthPath();

interface SaveNoteAuthOptions {
  headless?: boolean;
  outputPath?: string;
}

async function saveNoteAuth(options: SaveNoteAuthOptions = {}): Promise<void> {
  const {
    headless = false,
    outputPath = defaultAuthFilePath,
  } = options;
  const authManager = new AuthManager(outputPath);

  console.log('launching browser for note login...');
  const browser = await firefox.launch({
    headless,
    timeout: 60000,
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to note login page...');
  await page.goto('https://note.com/login');

  console.log(
    `\n*** ACTION REQUIRED ***\nPlease log in to note in the browser window.\nOnce you are successfully logged in, please CLOSE THE BROWSER WINDOW to continue.`,
  );

  try {
    await new Promise<void>(resolve => {
      page.on('close', async () => {
        console.log('Browser window closed by user. Saving note authentication state...');
        try {
          await authManager.saveAuthState(context);
          console.log(`Note authentication state saved to ${outputPath}`);
        } catch (saveError) {
          console.error('Failed to save note authentication state:', saveError);
        }
        resolve();
      });
    });

  } catch (error) {
    console.error(
      'Error during note login or authentication saving process:',
      error,
    );
  } finally {
    if (browser.isConnected()) {
      await browser.close();
    }
    process.stdin.pause();
  }
}

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option('headless', {
      type: 'boolean',
      description: 'Run browser in headless mode',
      default: false,
    })
    .option('outputPath', {
      type: 'string',
      description: 'Path to save the note authentication file',
      default: defaultAuthFilePath,
    })
    .help()
    .parse();

  await saveNoteAuth({
    headless: argv.headless,
    outputPath: argv.outputPath,
  });
}

if (require.main === module) {
  main().catch(console.error);
}
