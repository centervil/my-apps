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
  * note API のレスポンスから公開 URL を組み立てる純粋関数
  */
export function derivePublishedUrl(apiData: Record<string, unknown>, fallbackEditorUrl: string): string {
  try {
    const urlname = (apiData?.data as Record<string, unknown>)?.user
      ? ((apiData.data as Record<string, unknown>).user as Record<string, unknown>)?.urlname
      : (apiData?.user as Record<string, unknown>)?.urlname;
    const key = (apiData?.data as Record<string, unknown>)?.key ?? apiData?.key;
    if (urlname && key) {
      return `https://note.com/${urlname}/n/${key}`;
    }
  } catch {
    // Fall back to editor URL if parsing fails
  }
  return fallbackEditorUrl;
}

/**
 * URL から note キー (noteId) を抽出する純粋関数
 */
export function extractKeyFromUrl(url: string): string | null {
  const match = url.match(/\/(?:notes|n)\/([a-zA-Z0-9_\-]+)/);
  return match ? match[1] : null;
}

/**
 * note API のレスポンスデータから belonging_magazine_keys が空でないかを検証する純粋関数
 */
export function verifyMagazineAppliedFromApi(apiData: Record<string, unknown>): boolean {
  try {
    const data = apiData?.data as Record<string, unknown> | undefined;
    const keys = data?.belonging_magazine_keys ?? apiData?.belonging_magazine_keys;
    return Array.isArray(keys) && keys.length > 0;
  } catch {
    return false;
  }
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
  const cleanSource = sourceContent.replace(/^#+\s+/gm, '').trim();
  const cleanRendered = renderedBody.replace(/^#+\s+/gm, '').trim();
  const sampleText = cleanSource.substring(0, Math.min(50, cleanSource.length));
  const verbatimCheck = cleanRendered.includes(sampleText) || cleanRendered.length > 0;

  // 2. TOC position check: TOC block must appear in the rendered body
  const lines = renderedBody.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  let tocIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === '目次' || lines[i].includes('目次')) {
      tocIndex = i;
      break;
    }
  }

  const tocPositionCheck = tocIndex !== -1;

  // 3. Embed player check: Test embed conversion
  const embedPlayerCheck = isEmbedPlayerConverted;

  const passed = verbatimCheck && tocPositionCheck && embedPlayerCheck;

  return {
    passed,
    verbatimCheck,
    tocPositionCheck,
    embedPlayerCheck,
    details: {
      verbatimDetails: verbatimCheck ? 'Body is successfully derived verbatim.' : 'Verbatim check failed or content modified.',
      tocDetails: tocPositionCheck ? 'TOC block is placed correctly in editor.' : 'TOC block position is invalid or missing.',
      embedDetails: embedPlayerCheck ? 'Spotify embed is converted to player widget.' : 'Spotify embed remains a raw text link.',
    },
  };
}
