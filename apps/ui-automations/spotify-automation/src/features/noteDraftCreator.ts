export interface NoteDraftOptions {
  contentType: 'study' | 'news';
  sourceContent: string;
  seriesName?: string;
  dayNumber?: number;
  targetDate?: string;
  spotifyShowUrl: string;
  previousNoteId?: string; // For fetching eyecatch image if needed
}

export interface QualityCheckResult {
  verbatimCheck: boolean;
  tocPositionCheck: boolean;
  embedPlayerCheck: boolean;
  passed: boolean;
  details: {
    verbatimDetails: string;
    tocDetails: string;
    embedDetails: string;
  };
}

export const TEMPLATE_TEXT = 'この記事の内容はPodCastとしても配信しています。（最新記事以外は過去の配信回をご参照ください）';

/**
  * 正本 §5 に従った見出し変換とボディ構築を行う
  */
export function convertMarkdownToNoteBody(contentType: 'study' | 'news', rawMarkdown: string): string {
  const lines = rawMarkdown.split(/\r?\n/);
  const convertedLines: string[] = [];

  let isFirstHeading = true;

  for (const line of lines) {
    if (contentType === 'news' && line.startsWith('# ')) {
      // News title is used as article title, skip in body
      continue;
    }

    if (line.startsWith('## ')) {
      if (contentType === 'study' && isFirstHeading && line.includes('📚')) {
        // First heading in study: ## 📚 ... -> ### 📚 ...
        convertedLines.push(line.replace(/^## /, '### '));
        isFirstHeading = false;
      } else {
        // Other ## -> ## (h2)
        convertedLines.push(line);
      }
    } else if (line.startsWith('### ') || line.startsWith('#### ')) {
      // ### / #### -> ### (h3)
      convertedLines.push(line.replace(/^#{3,4} /, '### '));
    } else {
      convertedLines.push(line);
    }
  }

  return convertedLines.join('\n');
}

export function buildNoteContent(options: NoteDraftOptions): { title: string; body: string } {
  let title = '';
  if (options.contentType === 'study') {
    title = `${options.seriesName} 30日間学習Day${options.dayNumber}`;
  } else {
    title = `${options.targetDate} サイバーセキュリティニュースまとめ`;
  }

  const convertedBody = convertMarkdownToNoteBody(options.contentType, options.sourceContent);

  // Note shape: Fixed text -> Spotify Embed -> TOC -> Body
  const body = [
    TEMPLATE_TEXT,
    '',
    options.spotifyShowUrl,
    '',
    '目次',
    '',
    convertedBody,
  ].join('\n');

  return { title, body };
}

/**
  * 品質チェックを実行する
  */
export function performQualityCheck(
  sourceContent: string,
  renderedBody: string,
  isEmbedPlayerConverted: boolean,
): QualityCheckResult {
  // 1. Verbatim check: Check if converted body contains the core source content (ignoring header level adjustments)
  // Clean markdown headers for comparison
  const cleanSource = sourceContent.replace(/^#+\s+/gm, '').trim();
  const cleanRendered = renderedBody.replace(/^#+\s+/gm, '').trim();
  const verbatimCheck = cleanRendered.includes(cleanSource.substring(0, Math.min(100, cleanSource.length)));

  // 2. TOC position check: TOC block must appear right after embed URL
  const lines = renderedBody.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  // Find embed URL index
  let embedIndex = -1;
  let tocIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('open.spotify.com/show/')) {
      embedIndex = i;
    }
    if (lines[i] === '目次') {
      tocIndex = i;
    }
  }

  const tocPositionCheck = embedIndex !== -1 && tocIndex !== -1 && tocIndex === embedIndex + 1;

  // 3. Embed player check: Spotify embed must be converted to player widget
  const embedPlayerCheck = isEmbedPlayerConverted;

  const passed = verbatimCheck && tocPositionCheck && embedPlayerCheck;

  return {
    passed,
    verbatimCheck,
    tocPositionCheck,
    embedPlayerCheck,
    details: {
      verbatimDetails: verbatimCheck ? 'Body is successfully derived verbatim.' : 'Verbatim check failed or content modified.',
      tocDetails: tocPositionCheck ? 'TOC block is placed immediately after Spotify embed.' : 'TOC block position is invalid or missing.',
      embedDetails: embedPlayerCheck ? 'Spotify embed is converted to player widget.' : 'Spotify embed remains a raw text link.',
    },
  };
}
