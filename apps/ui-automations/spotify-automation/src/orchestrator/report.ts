import * as fs from 'fs';
import * as path from 'path';

export interface StepResult {
  status: 'SUCCESS' | 'SKIPPED' | 'WAITING_AUDIO' | 'SOURCE_MISSING' | 'AUTH_EXPIRED' | 'FAILED';
  detail?: string;
  outputUrl?: string;
  noteId?: string;
}

export interface SystemExecutionReport {
  target: any;
  spotify?: StepResult;
  note?: StepResult;
  status: string;
}

export interface DailyReport {
  runDate: string;
  startedAt: string;
  finishedAt: string;
  systems: {
    study?: SystemExecutionReport;
    news?: SystemExecutionReport;
  };
  calculatedProgress?: {
    spotify_day?: number;
    note_day?: number;
    spotify_date?: string;
    note_date?: string;
    spotify_last_episode?: number;
  };
  overallStatus: 'SUCCESS' | 'FAILED';
}

export function getStateFilePath(stateDir: string, runDate: string): string {
  return path.join(stateDir, `${runDate}.json`);
}

export function loadState(stateDir: string, runDate: string): Record<string, any> {
  const file = getStateFilePath(stateDir, runDate);
  if (fs.existsSync(file)) {
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return {};
    }
  }
  return {};
}

export function saveState(stateDir: string, runDate: string, state: Record<string, any>): void {
  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }
  const file = getStateFilePath(stateDir, runDate);
  fs.writeFileSync(file, JSON.stringify(state, null, 2), 'utf8');
}

export function checkAudioFile(audioDir: string, runDate: string, system: 'study' | 'news'): { found: boolean; filePath?: string; meta?: any } {
  const dateDir = path.join(audioDir, runDate);
  if (!fs.existsSync(dateDir)) {
    return { found: false };
  }

  const extensions = ['.m4a', '.mp3', '.wav'];
  let audioPath = '';
  for (const ext of extensions) {
    const p = path.join(dateDir, `${system}${ext}`);
    if (fs.existsSync(p)) {
      audioPath = p;
      break;
    }
  }

  if (!audioPath) {
    return { found: false };
  }

  let meta = undefined;
  const metaPath = path.join(dateDir, 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const metaContent = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      meta = metaContent[system === 'study' ? 'studyTitle' : 'newsTitle'] || metaContent;
    } catch {}
  }

  return { found: true, filePath: audioPath, meta };
}

export function extractShowId(showUrl: string): string {
  // e.g. https://podcasters.spotify.com/pod/show/show-name-xyz -> show-name-xyz
  const clean = showUrl.replace(/\/$/, '');
  const parts = clean.split('/');
  return parts[parts.length - 1];
}
