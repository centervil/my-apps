import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { firefox } from '@playwright/test';
import { buildNoteContent, convertMarkdownToNoteBody, TEMPLATE_TEXT } from './features/noteDraftCreator';
import { NoteEditorPage } from './pages/NoteEditorPage';
import { AuthManager } from './auth/authManager';
import { AuthError } from './auth/authErrors';
import { getNoteAuthPath } from './utils/paths';
import { mapErrorToExecutionResult, saveExecutionResult, ExecutionResult, ExecutionStatus } from './utils/resultReporter';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

export const main = async () => {
  const startTime = Date.now();
  const parser = yargs(hideBin(process.argv))
    .option('contentType', {
      type: 'string',
      choices: ['study', 'news'] as const,
      description: 'Content type (study or news)',
      demandOption: true,
    })
    .option('source', {
      alias: 's',
      type: 'string',
      description: 'Path to source markdown file',
      demandOption: true,
    })
    .option('seriesName', {
      type: 'string',
      description: 'Series name for study content',
    })
    .option('dayNumber', {
      type: 'number',
      description: 'Day number for study content',
    })
    .option('targetDate', {
      type: 'string',
      description: 'Target date for news content (YYYY-MM-DD)',
    })
    .option('spotifyShowUrl', {
      type: 'string',
      description: 'Spotify show URL or episode URL',
      demandOption: true,
    })
    .option('previousNoteId', {
      type: 'string',
      description: 'Previous note ID for reference',
    })
    .option('dryRun', {
      type: 'boolean',
      description: 'Perform a dry run without opening browser',
      default: false,
    })
    .option('headed', {
      type: 'boolean',
      description: 'Run browser in headed mode',
      default: false,
    })
    .help()
    .strict();

  try {
    const argv = await parser.parse();
    const {
      contentType,
      source,
      seriesName,
      dayNumber,
      targetDate,
      spotifyShowUrl,
      previousNoteId,
      dryRun,
      headed,
    } = argv;

    const resolvedSourcePath = path.resolve(source);
    if (!fs.existsSync(resolvedSourcePath)) {
      throw new Error(`Source file does not exist at: ${resolvedSourcePath}`);
    }

    const sourceContent = fs.readFileSync(resolvedSourcePath, 'utf-8');

    // Build content
    const { title, body } = buildNoteContent({
      contentType: contentType as 'study' | 'news',
      sourceContent,
      seriesName,
      dayNumber,
      targetDate,
      spotifyShowUrl,
      previousNoteId,
    });

    const convertedBody = convertMarkdownToNoteBody(contentType as 'study' | 'news', sourceContent);

    const resultOutputPath = path.resolve(process.cwd(), 'note-draft-result.json');

    // Handle Dry Run
    if (dryRun) {
      console.log('--- NOTE CLI DRY RUN ---');
      const dryRunDetails = {
        contentType,
        source: resolvedSourcePath,
        title,
        bodyPreview: body.substring(0, 200) + '...',
        spotifyShowUrl,
      };
      console.log(JSON.stringify(dryRunDetails, null, 2));

      const dryRunResult: ExecutionResult = {
        success: true,
        status: 'SUCCESS',
        exitCode: 0,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        details: dryRunDetails,
      };

      await saveExecutionResult(dryRunResult, resultOutputPath);
      process.exit(0);
    }

    // Check Auth File Existence
    const authPath = getNoteAuthPath();
    if (!fs.existsSync(authPath)) {
      throw new AuthError(
        `Note authentication file not found at ${authPath}. Please run 'npm run login:note' first.`,
        'AUTH_EXPIRED',
      );
    }

    // Launch Browser and Create Draft
    console.log('Launching browser for note draft creation...');
    const browser = await firefox.launch({
      headless: !headed,
      timeout: 60000,
    });
    const context = await browser.newContext();

    const authManager = new AuthManager(authPath);
    const authLoaded = await authManager.loadAuthState(context);
    if (!authLoaded) {
      throw new AuthError(
        'Failed to load note authentication state or session is invalid.',
        'AUTH_EXPIRED',
      );
    }

    const page = await context.newPage();
    const editorPage = new NoteEditorPage(page);

    console.log('Navigating to note editor...');
    await editorPage.navigateToNewNote();

    // Check if redirected to login page
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/signin')) {
      await browser.close();
      throw new AuthError(
        'Session expired or redirected to login page. Authentication required.',
        'AUTH_EXPIRED',
      );
    }

    console.log(`Setting title: ${title}`);
    await editorPage.setTitle(title);

    console.log('Setting body and embedding Spotify player...');
    await editorPage.setBodyAndEmbed(TEMPLATE_TEXT, spotifyShowUrl, convertedBody);

    console.log('Running quality checks on editor...');
    const qualityResult = await editorPage.runQualityCheckOnEditor(sourceContent);
    const noteId = editorPage.extractNoteId();
    const draftUrl = editorPage.getEditUrl();

    await browser.close();

    const status: ExecutionStatus = qualityResult.passed ? 'SUCCESS' : 'PERMANENT_FAILURE';
    const exitCode = qualityResult.passed ? 0 : 1;

    const executionResult: ExecutionResult = {
      success: qualityResult.passed,
      status,
      exitCode,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      details: {
        title,
        noteId: noteId || undefined,
        draftUrl: draftUrl || undefined,
        qualityCheck: qualityResult,
      },
    };

    await saveExecutionResult(executionResult, resultOutputPath);
    process.exit(exitCode);

  } catch (error: unknown) {
    console.error('\n❌ Note CLI process failed.');
    if (error instanceof Error) {
      console.error(error.message);
    }

    const execResult = mapErrorToExecutionResult(error, startTime);
    const resultOutputPath = path.resolve(process.cwd(), 'note-draft-result.json');
    await saveExecutionResult(execResult, resultOutputPath);
    console.log(JSON.stringify(execResult, null, 2));

    process.exit(execResult.exitCode);
  }
};

if (require.main === module) {
  main();
}
