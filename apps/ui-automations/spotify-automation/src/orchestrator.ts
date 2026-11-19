import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { parsePodcastSsot, determineStudyTarget, determineNewsTarget, getJstDateString } from './orchestrator/targets';
import { loadState, saveState, checkAudioFile, extractShowId, DailyReport, SystemExecutionReport } from './orchestrator/report';
import { AuthManager } from './auth/authManager';

interface CLIArgs {
  date?: string;
  dryRun?: boolean;
  docsDir: string;
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .option('date', { type: 'string', description: 'Execution date JST (YYYY-MM-DD)' })
    .option('dryRun', { type: 'boolean', default: false, description: 'Dry run mode' })
    .option('docsDir', { type: 'string', demandOption: true, description: 'Path to my-docs checkout' })
    .parse() as CLIArgs;

  const runDate = argv.date || getJstDateString();
  const dryRun = argv.dryRun;
  const docsDir = path.resolve(argv.docsDir);

  const audioDir = process.env.DAILY_AUDIO_DIR || '/home/devuser/workspace/daily-audio';
  const stateDir = process.env.DAILY_STATE_DIR || '/home/devuser/workspace/daily-publish-state';

  const startedAt = new Date().toISOString();
  console.log(`[Orchestrator] Starting daily-publish for runDate: ${runDate}, dryRun: ${dryRun}, docsDir: ${docsDir}`);

  // 1. Load SSOT
  let ssot;
  try {
    ssot = parsePodcastSsot(docsDir);
  } catch (err: any) {
    console.error(`[Orchestrator] Failed to parse podcast-ssot.yaml: ${err.message}`);
    const report: DailyReport = {
      runDate,
      startedAt,
      finishedAt: new Date().toISOString(),
      systems: {},
      overallStatus: 'FAILED'
    };
    fs.writeFileSync('daily-publish-report.json', JSON.stringify(report, null, 2), 'utf8');
    process.exit(1);
  }

  const showUrl = ssot.spotify_show_url;
  const showId = extractShowId(showUrl);
  const season = ssot.spotify_season || 1;

  // 2. Load state
  const state = loadState(stateDir, runDate);

  const systemsReport: DailyReport['systems'] = {};
  let hasFailure = false;

  // Helper auth check
  const spotifyAuthPath = process.env.SPOTIFY_AUTH_PATH;
  const noteAuthPath = process.env.NOTE_AUTH_PATH;
  const spotifyAuth = new AuthManager(spotifyAuthPath);
  const noteAuth = new AuthManager(noteAuthPath);

  const spotifyValid = spotifyAuth.isAuthValid();
  const noteValid = noteAuth.isAuthValid();

  if (!spotifyValid || !noteValid) {
    console.warn(`[Orchestrator] Warning: Auth validity check failed. Spotify: ${spotifyValid}, Note: ${noteValid}`);
  }

  // ==================== STUDY SYSTEM ====================
  const studyTarget = determineStudyTarget(ssot, docsDir);
  console.log(`[Orchestrator] Study target determination:`, studyTarget);

  if (studyTarget.status === 'SOURCE_MISSING') {
    systemsReport.study = {
      target: studyTarget,
      status: 'SOURCE_MISSING',
      spotify: { status: 'SOURCE_MISSING', detail: studyTarget.errorReason },
      note: { status: 'SOURCE_MISSING', detail: studyTarget.errorReason }
    };
    hasFailure = true;
  } else {
    // Check audio for study
    const audioCheck = checkAudioFile(audioDir, runDate, 'study');
    if (!audioCheck.found && !dryRun) {
      systemsReport.study = {
        target: studyTarget,
        status: 'WAITING_AUDIO',
        spotify: { status: 'WAITING_AUDIO', detail: 'Audio file not found in inbox' },
        note: { status: 'WAITING_AUDIO', detail: 'Audio file not found in inbox' }
      };
    } else {
      // In dryRun, if audio not found, mock it or proceed with dummy path
      const audioPath = audioCheck.filePath || (dryRun ? '/tmp/mock-audio.mp3' : '');
      const studyTitle = studyTarget.title || 'Study Episode';

      // Check auth
      if (!spotifyValid || !noteValid) {
        systemsReport.study = {
          target: studyTarget,
          status: 'AUTH_EXPIRED',
          spotify: { status: 'AUTH_EXPIRED', detail: 'Auth invalid' },
          note: { status: 'AUTH_EXPIRED', detail: 'Auth invalid' }
        };
        hasFailure = true;
      } else {
        // Execute Spotify & Note CLI
        const studyStateKey = `study_day_${studyTarget.targetDay}`;
        const studyState = state[studyStateKey] || {};

        let spotifyRes: any = studyState.spotify;
        if (!spotifyRes || spotifyRes.status !== 'SUCCESS') {
          console.log(`[Orchestrator] Executing Spotify upload for study Day ${studyTarget.targetDay}...`);
          const args = [
            'exec', 'tsx', 'src/cli.ts',
            '--showId', showId,
            '--audioPath', audioPath,
            '--title', studyTitle,
            '--description', `Study session for ${studyTitle}`,
            '--season', String(season),
            '--episode', String(studyTarget.targetDay)
          ];
          if (dryRun) args.push('--dryRun');

          const res = spawnSync('pnpm', args, { encoding: 'utf8', stdio: 'pipe' });
          console.log(res.stdout);
          if (res.stderr) console.error(res.stderr);

          // Read result json if exists
          let resultJson: any = {};
          try {
            if (fs.existsSync('spotify-automation-result.json')) {
              resultJson = JSON.parse(fs.readFileSync('spotify-automation-result.json', 'utf8'));
            }
          } catch {}

          if (res.status === 0 || resultJson.success) {
            spotifyRes = { status: 'SUCCESS', outputUrl: resultJson.episodeUrl || resultJson.url };
          } else {
            spotifyRes = { status: 'FAILED', detail: res.stderr || res.stdout || 'Spotify CLI failed' };
            hasFailure = true;
          }
          studyState.spotify = spotifyRes;
        }

        let noteRes: any = studyState.note;
        if (spotifyRes.status === 'SUCCESS' && (!noteRes || noteRes.status !== 'SUCCESS')) {
          console.log(`[Orchestrator] Executing note CLI for study Day ${studyTarget.targetDay}...`);
          const args = [
            'exec', 'tsx', 'src/noteCli.ts',
            '--contentType', 'study',
            '--source', studyTarget.sourcePath!,
            '--spotifyShowUrl', showUrl,
            '--seriesName', studyTarget.title!.split(' Day')[0],
            '--dayNumber', String(studyTarget.targetDay)
          ];
          if (dryRun) args.push('--dryRun');

          const res = spawnSync('pnpm', args, { encoding: 'utf8', stdio: 'pipe' });
          console.log(res.stdout);
          if (res.stderr) console.error(res.stderr);

          let resultJson: any = {};
          try {
            if (fs.existsSync('note-draft-result.json')) {
              resultJson = JSON.parse(fs.readFileSync('note-draft-result.json', 'utf8'));
            }
          } catch {}

          if (res.status === 0 || resultJson.success) {
            noteRes = { status: 'SUCCESS', noteId: resultJson.noteId, outputUrl: resultJson.url };
          } else {
            noteRes = { status: 'FAILED', detail: res.stderr || res.stdout || 'Note CLI failed' };
            hasFailure = true;
          }
          studyState.note = noteRes;
        }

        state[studyStateKey] = studyState;
        saveState(stateDir, runDate, state);

        const overallStudyStatus = (spotifyRes.status === 'SUCCESS' && noteRes?.status === 'SUCCESS') ? 'SUCCESS' : 'FAILED';
        systemsReport.study = {
          target: studyTarget,
          status: overallStudyStatus,
          spotify: spotifyRes,
          note: noteRes
        };
      }
    }
  }

  // ==================== NEWS SYSTEM ====================
  const newsTarget = determineNewsTarget(ssot, docsDir, runDate);
  console.log(`[Orchestrator] News target determination:`, newsTarget);

  if (newsTarget.status === 'SKIPPED') {
    systemsReport.news = {
      target: newsTarget,
      status: 'SKIPPED',
      spotify: { status: 'SKIPPED', detail: newsTarget.errorReason },
      note: { status: 'SKIPPED', detail: newsTarget.errorReason }
    };
  } else if (newsTarget.status === 'SOURCE_MISSING') {
    systemsReport.news = {
      target: newsTarget,
      status: 'SOURCE_MISSING',
      spotify: { status: 'SOURCE_MISSING', detail: newsTarget.errorReason },
      note: { status: 'SOURCE_MISSING', detail: newsTarget.errorReason }
    };
    hasFailure = true;
  } else {
    const audioCheck = checkAudioFile(audioDir, runDate, 'news');
    if (!audioCheck.found && !dryRun) {
      systemsReport.news = {
        target: newsTarget,
        status: 'WAITING_AUDIO',
        spotify: { status: 'WAITING_AUDIO', detail: 'Audio file not found in inbox' },
        note: { status: 'WAITING_AUDIO', detail: 'Audio file not found in inbox' }
      };
    } else {
      const audioPath = audioCheck.filePath || (dryRun ? '/tmp/mock-audio.mp3' : '');
      const newsTitle = newsTarget.title || 'Cybersecurity News';

      if (!spotifyValid || !noteValid) {
        systemsReport.news = {
          target: newsTarget,
          status: 'AUTH_EXPIRED',
          spotify: { status: 'AUTH_EXPIRED', detail: 'Auth invalid' },
          note: { status: 'AUTH_EXPIRED', detail: 'Auth invalid' }
        };
        hasFailure = true;
      } else {
        const newsStateKey = `news_date_${newsTarget.targetDate}`;
        const newsState = state[newsStateKey] || {};

        let spotifyRes: any = newsState.spotify;
        if (!spotifyRes || spotifyRes.status !== 'SUCCESS') {
          console.log(`[Orchestrator] Executing Spotify upload for news ${newsTarget.targetDate}...`);
          const args = [
            'exec', 'tsx', 'src/cli.ts',
            '--showId', showId,
            '--audioPath', audioPath,
            '--title', newsTitle,
            '--description', `Cybersecurity news summary for ${newsTarget.targetDate}`,
            '--season', '1',
            '--episode', String(newsTarget.episodeNumber)
          ];
          if (dryRun) args.push('--dryRun');

          const res = spawnSync('pnpm', args, { encoding: 'utf8', stdio: 'pipe' });
          console.log(res.stdout);
          if (res.stderr) console.error(res.stderr);

          let resultJson: any = {};
          try {
            if (fs.existsSync('spotify-automation-result.json')) {
              resultJson = JSON.parse(fs.readFileSync('spotify-automation-result.json', 'utf8'));
            }
          } catch {}

          if (res.status === 0 || resultJson.success) {
            spotifyRes = { status: 'SUCCESS', outputUrl: resultJson.episodeUrl || resultJson.url };
          } else {
            spotifyRes = { status: 'FAILED', detail: res.stderr || res.stdout || 'Spotify CLI failed' };
            hasFailure = true;
          }
          newsState.spotify = spotifyRes;
        }

        let noteRes: any = newsState.note;
        if (spotifyRes.status === 'SUCCESS' && (!noteRes || noteRes.status !== 'SUCCESS')) {
          console.log(`[Orchestrator] Executing note CLI for news ${newsTarget.targetDate}...`);
          const args = [
            'exec', 'tsx', 'src/noteCli.ts',
            '--contentType', 'news',
            '--source', newsTarget.sourcePath!,
            '--spotifyShowUrl', showUrl,
            '--targetDate', newsTarget.targetDate!
          ];
          if (dryRun) args.push('--dryRun');

          const res = spawnSync('pnpm', args, { encoding: 'utf8', stdio: 'pipe' });
          console.log(res.stdout);
          if (res.stderr) console.error(res.stderr);

          let resultJson: any = {};
          try {
            if (fs.existsSync('note-draft-result.json')) {
              resultJson = JSON.parse(fs.readFileSync('note-draft-result.json', 'utf8'));
            }
          } catch {}

          if (res.status === 0 || resultJson.success) {
            noteRes = { status: 'SUCCESS', noteId: resultJson.noteId, outputUrl: resultJson.url };
          } else {
            noteRes = { status: 'FAILED', detail: res.stderr || res.stdout || 'Note CLI failed' };
            hasFailure = true;
          }
          newsState.note = noteRes;
        }

        state[newsStateKey] = newsState;
        saveState(stateDir, runDate, state);

        const overallNewsStatus = (spotifyRes.status === 'SUCCESS' && noteRes?.status === 'SUCCESS') ? 'SUCCESS' : 'FAILED';
        systemsReport.news = {
          target: newsTarget,
          status: overallNewsStatus,
          spotify: spotifyRes,
          note: noteRes
        };
      }
    }
  }

  const overallStatus = hasFailure ? 'FAILED' : 'SUCCESS';
  const report: DailyReport = {
    runDate,
    startedAt,
    finishedAt: new Date().toISOString(),
    systems: systemsReport,
    calculatedProgress: {
      spotify_day: studyTarget.status === 'SUCCESS' && systemsReport.study?.status === 'SUCCESS' ? studyTarget.targetDay : ssot.progress.spotify_day,
      note_day: studyTarget.status === 'SUCCESS' && systemsReport.study?.status === 'SUCCESS' ? studyTarget.targetDay : ssot.progress.note_day,
      spotify_date: newsTarget.status === 'SUCCESS' && systemsReport.news?.status === 'SUCCESS' ? newsTarget.targetDate : ssot.progress.spotify_date,
      note_date: newsTarget.status === 'SUCCESS' && systemsReport.news?.status === 'SUCCESS' ? newsTarget.targetDate : ssot.progress.note_date,
      spotify_last_episode: newsTarget.status === 'SUCCESS' && systemsReport.news?.status === 'SUCCESS' ? newsTarget.episodeNumber : ssot.progress.spotify_last_episode
    },
    overallStatus
  };

  fs.writeFileSync('daily-publish-report.json', JSON.stringify(report, null, 2), 'utf8');
  console.log(`[Orchestrator] Completed. Report written to daily-publish-report.json. Overall status: ${overallStatus}`);

  if (hasFailure) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('[Orchestrator] Unhandled error:', err);
  process.exit(1);
});
