import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';
import { firefox } from '@playwright/test';
import { buildNoteContent, convertMarkdownToNoteBody, TEMPLATE_TEXT, verifyPostPublishGate, PostPublishGateResult, verifyDraftSaved, DraftSavedResult, extractUrlnameFromCreatorPageHref } from './features/noteDraftCreator';
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
    .option('publish', {
      type: 'boolean',
      description: 'Publish note after quality checks',
      default: false,
    })
    .option('tags', {
      type: 'string',
      description: 'Comma-separated tags for publication',
    })
    .option('magazine', {
      type: 'string',
      description: 'Magazine name for publication',
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
      publish,
      tags,
      magazine,
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
        publish,
        tags,
        magazine,
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
    console.log('Launching browser for note safety checks & automation...');
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

    // 1. Account verification (Measure 1): Verify logged-in user urlname matches NOTE_ACCOUNT_URLNAME if specified
    const expectedAccount = process.env.NOTE_ACCOUNT_URLNAME || process.env.NOTE_TARGET_ACCOUNT;
    if (expectedAccount) {
      console.log(`Verifying logged-in note account against expected account: ${expectedAccount}`);
      await page.goto('https://note.com/');
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { /* fall through to the fixed wait */ });
      await page.waitForTimeout(2000);
      const userMenuButton = page.locator('button[aria-controls="userMenu"]');
      try {
        await userMenuButton.waitFor({ state: 'visible', timeout: 15000 });
      } catch {
        throw new AuthError(
          `User menu button 'button[aria-controls="userMenu"]' did not appear within 15000ms. Aborting process (fail-closed).`,
          'ACCOUNT_CHECK_FAILED',
          false,
        );
      }

      await userMenuButton.click();
      const userMenu = page.locator('#userMenu');
      let menuOpenSuccess = true;
      try {
        await Promise.all([
          userMenu.waitFor({ state: 'attached', timeout: 5000 }),
          userMenuButton.waitFor({ state: 'attached', timeout: 5000 }), // dummy or check aria-expanded
          page.waitForFunction(() => document.querySelector('button[aria-controls="userMenu"]')?.getAttribute('aria-expanded') === 'true', { timeout: 5000 })
        ]);
      } catch {
        menuOpenSuccess = false;
      }

      if (!menuOpenSuccess) {
        await userMenuButton.click();
        try {
          await Promise.all([
            userMenu.waitFor({ state: 'attached', timeout: 5000 }),
            page.waitForFunction(() => document.querySelector('button[aria-controls="userMenu"]')?.getAttribute('aria-expanded') === 'true', { timeout: 5000 })
          ]);
        } catch {
          throw new AuthError(
            `User menu '#userMenu' did not open or aria-expanded did not become true after clicking user menu button twice. Aborting process (fail-closed).`,
            'ACCOUNT_CHECK_FAILED',
            false,
          );
        }
      }

      const creatorPageLinks = userMenu.locator('a', { hasText: 'クリエイターページ' });
      try {
        await creatorPageLinks.first().waitFor({ state: 'attached', timeout: 10000 });
      } catch {
        throw new AuthError(
          `Anchor with text 'クリエイターページ' did not appear in user menu within 10000ms. Aborting process (fail-closed).`,
          'ACCOUNT_CHECK_FAILED',
          false,
        );
      }
      const linkCount = await creatorPageLinks.count();
      if (linkCount !== 1) {
        throw new AuthError(
          `Expected exactly one anchor with text 'クリエイターページ' in user menu, but found ${linkCount}. Aborting process (fail-closed).`,
          'ACCOUNT_CHECK_FAILED',
          false,
        );
      }

      const href = await creatorPageLinks.first().getAttribute('href');
      const currentUrlname = extractUrlnameFromCreatorPageHref(href);
      if (!currentUrlname) {
        throw new AuthError(
          `Could not extract valid urlname from creator page href '${href}'. Aborting process (fail-closed).`,
          'ACCOUNT_CHECK_FAILED',
          false,
        );
      }

      console.log(`Current logged-in note urlname: ${currentUrlname}`);
      if (currentUrlname !== expectedAccount) {
        throw new AuthError(
          `Account mismatch! Expected note account urlname '${expectedAccount}', but current logged-in account is '${currentUrlname}'. Aborting process to protect production account.`,
          'ACCOUNT_MISMATCH',
          false,
        );
      }
    }

    // Prevent test publishing/creation on production account if test account environment is expected
    const isTestAccount = expectedAccount && (expectedAccount.includes('test') || expectedAccount.includes('centerviltest'));
    if (!isTestAccount && expectedAccount === 'centervil' && publish) {
      console.log('⚠️ Warning: Publishing with production account specified.');
    }

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

    let eyecatchResult: { success: boolean; message?: string } | undefined = undefined;
    if (previousNoteId) {
      console.log(`Setting eyecatch image from previous note ID: ${previousNoteId}`);
      eyecatchResult = await editorPage.setEyecatchImageFromPreviousNote(previousNoteId);
      console.log('Eyecatch result:', eyecatchResult);
    }

    console.log('Setting body and embedding Spotify player...');
    await editorPage.setBodyAndEmbed(TEMPLATE_TEXT, spotifyShowUrl, convertedBody);

    console.log('Running quality checks on editor...');
    const qualityResult = await editorPage.runQualityCheckOnEditor(sourceContent);
    const noteId = editorPage.extractNoteId();
    const draftUrl = editorPage.getEditUrl();

    if (!qualityResult.passed) {
      await browser.close();
      const executionResult: ExecutionResult = {
        success: false,
        status: 'QUALITY_CHECK_FAILED',
        exitCode: 1,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        details: {
          title,
          noteId: noteId || undefined,
          draftUrl: draftUrl || undefined,
          eyecatchResult,
          qualityCheck: qualityResult,
        },
      };
      await saveExecutionResult(executionResult, resultOutputPath);
      console.error('\n❌ Quality check failed. Aborting publication.');
      process.exit(1);
    }

    let publishedUrl: string | undefined = undefined;
    let publishDetails: { tagsApplied: string[]; magazineApplied: string | null } | undefined = undefined;
    let publishFailed = false;
    let postPublishGateResult: PostPublishGateResult | undefined = undefined;
    let draftSavedResult: DraftSavedResult | undefined = undefined;

    if (!publish) {
      if (!noteId) {
        const executionResult: ExecutionResult = {
          success: false,
          status: 'QUALITY_CHECK_FAILED',
          exitCode: 1,
          errorCode: 'DRAFT_SAVE_NOT_VERIFIED',
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          details: {
            title,
            draftUrl: draftUrl || undefined,
            eyecatchResult,
            qualityCheck: qualityResult,
            error: 'noteId could not be extracted for draft verification',
          },
        };
        await saveExecutionResult(executionResult, resultOutputPath);
        console.error('\n❌ Draft save verification failed: noteId is null.');
        await browser.close();
        process.exit(1);
      }

      console.log('Quality checks passed. Proceeding to save and verify draft...');
      const draftSaveButton = page.locator('button:has-text("下書き保存"), button:has-text("一時保存")').first();
      const buttonCount = await draftSaveButton.count();
      if (buttonCount === 0) {
        const error = new Error('Draft save button not found on editor page');
        (error as Record<string, unknown>).code = 'DRAFT_SAVE_FAILED';
        throw error;
      }

      try {
        const saveResponsePromise = page.waitForResponse(
          (resp) => resp.url().includes('/api/v1/text_notes/draft_save') && resp.ok(),
          { timeout: 15000 }
        );
        await draftSaveButton.click();
        await saveResponsePromise;
      } catch (saveErr) {
        const error = new Error(`Draft save failed: ${saveErr instanceof Error ? saveErr.message : String(saveErr)}`);
        (error as Record<string, unknown>).code = 'DRAFT_SAVE_FAILED';
        throw error;
      }

      console.log(`[Draft Verification] Fetching note API for draft verification (noteId: ${noteId})...`);
      const apiResp = await page.request.get(`https://note.com/api/v3/notes/${noteId}?draft=true`);
      let apiResponseData: unknown = {};
      if (apiResp.ok()) {
        apiResponseData = await apiResp.json();
      } else {
        console.error(`[Draft Verification] Failed to fetch draft API (status: ${apiResp.status()}).`);
      }

      draftSavedResult = verifyDraftSaved(apiResponseData, { title, spotifyShowUrl });
      console.log('[Draft Verification] Verification result:', JSON.stringify(draftSavedResult, null, 2));

      if (!draftSavedResult.passed) {
        const executionResult: ExecutionResult = {
          success: false,
          status: 'QUALITY_CHECK_FAILED',
          exitCode: 1,
          errorCode: 'DRAFT_SAVE_NOT_VERIFIED',
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          details: {
            title,
            noteId: noteId || undefined,
            draftUrl: draftUrl || undefined,
            eyecatchResult,
            qualityCheck: qualityResult,
            draftVerification: draftSavedResult,
          },
        };
        await saveExecutionResult(executionResult, resultOutputPath);
        console.error('\n❌ Draft save server-side verification failed.');
        await browser.close();
        process.exit(1);
      }

      console.log('✅ [Draft Verification] Draft saved and verified server-side successfully!');
    }

    if (publish) {
      if (previousNoteId && eyecatchResult && !eyecatchResult.success) {
        console.error(`\n❌ Eyecatch setting failed: ${eyecatchResult.message}. Aborting publication due to strict eyecatch requirement.`);
        publishFailed = true;
      }

      if (!publishFailed) {
        console.log('Quality checks passed. Proceeding to publish note...');
        const tagList = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined;
        const pubResult = await editorPage.publishNote(tagList, magazine);
        publishedUrl = pubResult.publishedUrl;
        publishDetails = {
          tagsApplied: pubResult.tagsApplied,
          magazineApplied: pubResult.magazineApplied,
        };
        console.log(`Successfully published note at: ${publishedUrl}`, publishDetails);

        // Verify if requested tags/magazine were successfully applied
        const requestedTags = tagList || [];
        const requestedMagazine = magazine || null;

        const tagsMismatch = requestedTags.some(t => {
          const clean = t.startsWith('#') ? t.substring(1) : t;
          return !publishDetails!.tagsApplied.includes(clean);
        });
        const magazineMismatch = requestedMagazine !== null && publishDetails!.magazineApplied !== requestedMagazine;

        if (tagsMismatch || magazineMismatch) {
          console.error('\n❌ Requested tags or magazine could not be fully verified as applied.');
          publishFailed = true;
        }

        // Post-publish gate verification (verifyPostPublishGate)
        if (!publishFailed && noteId) {
          console.log(`[Post-Publish Gate] Verifying published note via API and public page for noteId: ${noteId}...`);
          try {
            // 1. Fetch note API response (GET https://note.com/api/v3/notes/<key>)
            const apiResp = await page.request.get(`https://note.com/api/v3/notes/${noteId}`);
            let apiResponseData: Record<string, unknown> = {};
            if (apiResp.ok()) {
              apiResponseData = await apiResp.json();
            } else {
              console.error(`[Post-Publish Gate] Failed to fetch note API response (status: ${apiResp.status()}). Treating verification as failed.`);
              apiResponseData = { error: `API status ${apiResp.status()}` };
            }

            // 2. Fetch public page HTML (https://note.com/<urlname>/n/<key>)
            let publicPageHtml = '';
            if (publishedUrl) {
              try {
                const htmlResp = await page.request.get(publishedUrl);
                if (htmlResp.ok()) {
                  publicPageHtml = await htmlResp.text();
                } else {
                  console.error(`[Post-Publish Gate] Failed to fetch public page HTML from ${publishedUrl} (status: ${htmlResp.status()}).`);
                }
              } catch (htmlErr) {
                console.error(`[Post-Publish Gate] Error fetching public page HTML:`, htmlErr);
              }
            }

            postPublishGateResult = verifyPostPublishGate({
              apiResponse: apiResponseData,
              publicPageHtml,
              expectedTitle: title,
              spotifyShowUrl,
            });

            console.log('[Post-Publish Gate] Verification result:', JSON.stringify(postPublishGateResult, null, 2));

            if (!postPublishGateResult.passed) {
              console.error('\n❌ Post-publish gate verification failed!');
              publishFailed = true;
            } else {
              console.log('✅ [Post-Publish Gate] All post-publish gate checks passed successfully!');
            }
          } catch (gateErr) {
            console.error('[Post-Publish Gate] Exception during verification:', gateErr);
            postPublishGateResult = {
              passed: false,
              checks: {
                embeddedContentsEntryFound: false,
                figureServiceAndKeyMatch: false,
                publicPageIframeExists: false,
                titleExactMatch: false,
              },
              details: {
                embeddedContentsCount: 0,
                matchedKey: null,
                figureService: null,
                figureKey: null,
                publicIframeSrcFound: false,
                apiTitle: null,
                expectedTitle: title,
                failureReasons: [`Exception during post-publish gate verification: ${gateErr instanceof Error ? gateErr.message : String(gateErr)}`],
              },
            };
            publishFailed = true;
          }
        }
      }
    }

    await browser.close();

    const status: ExecutionStatus = publishFailed ? (postPublishGateResult && !postPublishGateResult.passed ? 'QUALITY_CHECK_FAILED' : 'PUBLISH_SETTINGS_FAILED') : 'SUCCESS';
    const exitCode = publishFailed ? 1 : 0;

    const executionResult: ExecutionResult = {
      success: true,
      status,
      exitCode,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
      details: {
        title,
        noteId: noteId || undefined,
        draftUrl: draftUrl || undefined,
        publishedUrl,
        eyecatchResult,
        qualityCheck: qualityResult,
        ...(publishDetails || {}),
        ...(postPublishGateResult ? { postPublishGate: postPublishGateResult } : {}),
        ...(draftSavedResult ? { draftVerification: draftSavedResult } : {}),
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
