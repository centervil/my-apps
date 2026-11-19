import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';

export interface PodcastSsotConfig {
  spotify_show_url: string;
  spotify_season: number;
  progress: {
    spotify_day: number;
    note_day: number;
    spotify_date?: string;
    note_date?: string;
    spotify_last_episode?: number;
  };
  themes: Array<{
    name: string;
    path: string;
    total_days: number;
  }>;
}

export type TargetStatus = 'SUCCESS' | 'SKIPPED' | 'WAITING_AUDIO' | 'SOURCE_MISSING' | 'AUTH_EXPIRED' | 'FAILED';

export interface TargetDeterminationResult {
  system: 'study' | 'news';
  status: TargetStatus;
  targetDay?: number;
  targetDate?: string;
  episodeNumber?: number;
  sourcePath?: string;
  title?: string;
  description?: string;
  errorReason?: string;
  nextProgress?: Record<string, any>;
}

/**
 * Parses JST date from Date object or YYYY-MM-DD string with UTC+9 fixed offset.
 */
export function getJstDateString(date: Date = new Date()): string {
  // Convert to JST (UTC+9)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const jstDate = new Date(utc + 9 * 3600000);
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, '0');
  const day = String(jstDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getPreviousJstDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parsePodcastSsot(docsDir: string): PodcastSsotConfig {
  const ssotPath = path.join(docsDir, 'config', 'podcast-ssot.yaml');
  if (!fs.existsSync(ssotPath)) {
    throw new Error(`SSOT config not found at ${ssotPath}`);
  }
  const content = fs.readFileSync(ssotPath, 'utf8');
  return yaml.load(content) as PodcastSsotConfig;
}

export function determineStudyTarget(ssot: PodcastSsotConfig, docsDir: string): TargetDeterminationResult {
  const progress = ssot.progress || { spotify_day: 0, note_day: 0 };
  const targetDay = Math.min(progress.spotify_day, progress.note_day) + 1;

  // Find theme
  const themes = ssot.themes || [];
  if (themes.length === 0) {
    return {
      system: 'study',
      status: 'SOURCE_MISSING',
      errorReason: 'No themes defined in SSOT'
    };
  }

  // Simple heuristic or active theme: assume first theme or iterate
  // Let's check themes until we find one that has the file for targetDay
  let sourcePath = '';
  let themeName = '';
  for (const theme of themes) {
    if (targetDay <= theme.total_days) {
      const relPath = `${theme.path}/Day${targetDay}_study.md`;
      const fullPath = path.join(docsDir, relPath);
      if (fs.existsSync(fullPath)) {
        sourcePath = fullPath;
        themeName = theme.name;
        break;
      } else {
        // Try checking if it exists directly relative to docsDir or theme path
        const altPath = path.join(docsDir, theme.path, `Day${targetDay}_study.md`);
        if (fs.existsSync(altPath)) {
          sourcePath = altPath;
          themeName = theme.name;
          break;
        }
      }
    }
  }

  if (!sourcePath) {
    // Fallback check on standard layout security-study/DayN_study.md or similar
    const defaultPath = path.join(docsDir, 'security-study', `Day${targetDay}_study.md`);
    if (fs.existsSync(defaultPath)) {
      sourcePath = defaultPath;
      themeName = themes[0]?.name || 'Security Study';
    } else {
      return {
        system: 'study',
        status: 'SOURCE_MISSING',
        targetDay,
        errorReason: `Study source file for Day ${targetDay} not found in docsDir`
      };
    }
  }

  const title = `${themeName} Day${targetDay}`;
  return {
    system: 'study',
    status: 'SUCCESS', // Initial determination success; execution steps will check audio/auth
    targetDay,
    sourcePath,
    title,
    nextProgress: {
      spotify_day: targetDay,
      note_day: targetDay
    }
  };
}

export function determineNewsTarget(ssot: PodcastSsotConfig, docsDir: string, runDateJst: string): TargetDeterminationResult {
  const progress = ssot.progress || { spotify_date: '', note_date: '', spotify_last_episode: 0 };
  const targetDate = getPreviousJstDateString(runDateJst);

  // Check if both spotify_date and note_date are >= targetDate
  if (progress.spotify_date && progress.spotify_date >= targetDate && progress.note_date && progress.note_date >= targetDate) {
    return {
      system: 'news',
      status: 'SKIPPED',
      targetDate,
      errorReason: `News for ${targetDate} already completed in SSOT`
    };
  }

  // Source path check: <docsDir>/security-news/cybersecurity_news_<targetDate>.md
  const sourcePath = path.join(docsDir, 'security-news', `cybersecurity_news_${targetDate}.md`);
  if (!fs.existsSync(sourcePath)) {
    return {
      system: 'news',
      status: 'SOURCE_MISSING',
      targetDate,
      errorReason: `News source file for ${targetDate} not found at ${sourcePath}`
    };
  }

  // Format title: YYYY年M月D日サイバーセキュリティニュース
  const [y, m, d] = targetDate.split('-').map(Number);
  const title = `${y}年${m}月${d}日サイバーセキュリティニュース`;
  const episodeNumber = (progress.spotify_last_episode || 0) + 1;

  return {
    system: 'news',
    status: 'SUCCESS',
    targetDate,
    episodeNumber,
    sourcePath,
    title,
    nextProgress: {
      spotify_date: targetDate,
      note_date: targetDate,
      spotify_last_episode: episodeNumber
    }
  };
}
