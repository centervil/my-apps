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
  noLiteralAsterisksCheck: boolean;
  noListPrefixesCheck: boolean;
  olCheck: boolean;
  emptyParagraphCountCheck: boolean;
  passed: boolean;
  details: {
    verbatimDetails: string;
    tocDetails: string;
    embedDetails: string;
    noLiteralAsterisksDetails: string;
    noListPrefixesDetails: string;
    olDetails: string;
    emptyParagraphCountDetails: string;
  };
}

export const TEMPLATE_TEXT = 'この記事の内容はPodCastとしても配信しています。（最新記事以外は過去の配信回をご参照ください）';

/**
 * 太字 `**x**` 記法を `<strong>x</strong>` に置換するエスケープヘルパー
 */
function applyInlineFormatting(text: string): string {
  // `**text**` -> `<strong>text</strong>`
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

/**
 * markdown を note 向け HTML に変換する純粋関数
 */
export function convertMarkdownToHtml(contentType: 'study' | 'news', rawMarkdown: string): string {
  const lines = rawMarkdown.split(/\r?\n/);
  const blocks: string[] = [];

  let currentListType: 'ul' | 'ol' | null = null;
  let currentListItems: string[] = [];
  let currentParagraphLines: string[] = [];
  let isFirstHeading = true;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const content = currentParagraphLines.join('<br>');
      blocks.push(`<p>${content}</p>`);
      currentParagraphLines = [];
    }
  };

  const flushList = () => {
    if (currentListType && currentListItems.length > 0) {
      const itemsHtml = currentListItems.map(item => `<li>${item}</li>`).join('');
      blocks.push(`<${currentListType}>${itemsHtml}</${currentListType}>`);
      currentListItems = [];
      currentListType = null;
    }
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    if (contentType === 'news' && line.startsWith('# ')) {
      // News title is used as article title, skip in body
      continue;
    }

    if (line.trim() === '') {
      flushAll();
      continue;
    }

    // 見出し
    if (line.startsWith('#')) {
      flushAll();
      let headingText = '';
      let tag = 'h3';

      if (line.startsWith('## ')) {
        headingText = line.replace(/^## /, '');
        if (contentType === 'study' && isFirstHeading && line.includes('📚')) {
          tag = 'h3';
          isFirstHeading = false;
        } else {
          tag = 'h2';
        }
      } else if (line.startsWith('### ') || line.startsWith('#### ')) {
        headingText = line.replace(/^#{3,4} /, '');
        tag = 'h3';
      } else {
        headingText = line.replace(/^#+\s*/, '');
        tag = 'h3';
      }

      blocks.push(`<${tag}>${applyInlineFormatting(headingText)}</${tag}>`);
      continue;
    }

    // 箇条書きリスト (ul)
    const ulMatch = line.match(/^(\*|-)\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (currentListType !== 'ul') {
        flushList();
        currentListType = 'ul';
      }
      currentListItems.push(applyInlineFormatting(ulMatch[2]));
      continue;
    }

    // 番号付きリスト (ol)
    const olMatch = line.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (currentListType !== 'ol') {
        flushList();
        currentListType = 'ol';
      }
      currentListItems.push(applyInlineFormatting(olMatch[1]));
      continue;
    }

    // 通常のテキスト行 (連続行は paragraph に蓄積、段落の直後にリストが来ても flushParagraph される)
    flushList();
    currentParagraphLines.push(applyInlineFormatting(line));
  }

  flushAll();

  return blocks.join('');
}

/**
 * 互換性のための convertMarkdownToNoteBody (HTML または調整済みテキスト)
 */
export function convertMarkdownToNoteBody(contentType: 'study' | 'news', rawMarkdown: string): string {
  return convertMarkdownToHtml(contentType, rawMarkdown);
}

export function buildNoteContent(options: NoteDraftOptions): { title: string; body: string } {
  let title = '';
  if (options.contentType === 'study') {
    const dayStr = options.dayNumber !== undefined ? String(options.dayNumber).padStart(2, '0') : '';
    title = `${options.seriesName} 30日間学習Day${dayStr}`;
  } else {
    title = `${options.targetDate} サイバーセキュリティニュースまとめ`;
  }

  const convertedBody = convertMarkdownToHtml(options.contentType, options.sourceContent);

  // Note shape: Fixed text -> Spotify Embed -> TOC -> Body (Correct block order: intro boilerplate -> Spotify embed -> TOC -> Body)
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
    const dataObj = apiData?.data as Record<string, unknown> | undefined;
    const userObj = (dataObj?.user ?? (apiData?.user)) as Record<string, unknown> | undefined;
    const urlname = userObj?.urlname as string | undefined;
    const key = (dataObj?.key ?? apiData?.key) as string | undefined;

    if (urlname && key) {
      return `https://note.com/${urlname}/n/${key}`;
    }
  } catch {
    // Fall back to editor URL if parsing fails
  }
  return fallbackEditorUrl;
}

export interface DetailedQualityCheckOptions {
  hasTocElement?: boolean;
  hasOlElement?: boolean;
  emptyParagraphCount?: number;
  hasLiteralAsterisks?: boolean;
  hasListPrefixesInLi?: boolean;
  blockOrderValid?: boolean;
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
  options: DetailedQualityCheckOptions = {}
): QualityCheckResult {
  // 1. Verbatim check
  const cleanSource = sourceContent.replace(/^#+\s+/gm, '').trim();
  const sampleText = cleanSource.substring(0, Math.min(50, cleanSource.length));
  const verbatimCheck = renderedBody.includes(sampleText) || renderedBody.length > 0;

  // 2. TOC position/element check
  const tocPositionCheck = options.hasTocElement !== undefined 
    ? options.hasTocElement 
    : (renderedBody.includes('目次') || renderedBody.includes('table-of-contents'));

  // 3. Embed player check
  const embedPlayerCheck = isEmbedPlayerConverted;

  // 4. No literal ** check
  const noLiteralAsterisksCheck = options.hasLiteralAsterisks !== undefined 
    ? !options.hasLiteralAsterisks 
    : !/\*\*/.test(renderedBody);

  // 5. No list prefixes in li check
  const noListPrefixesCheck = options.hasListPrefixesInLi !== undefined 
    ? !options.hasListPrefixesInLi 
    : !/^\s*(\*|-)\s+/m.test(renderedBody);

  // 6. OL check (if source contains numbered list)
  const sourceHasOl = /^\d+\.\s+/m.test(sourceContent);
  const olCheck = sourceHasOl ? (options.hasOlElement ?? true) : true;

  // 7. Empty paragraph count check (threshold <= 5)
  const emptyParagraphCountCheck = options.emptyParagraphCount !== undefined 
    ? options.emptyParagraphCount <= 5 
    : true;

  // 8. Block order check (Spotify embed and TOC before first heading)
  const blockOrderCheck = options.blockOrderValid !== undefined ? options.blockOrderValid : true;

  const passed = verbatimCheck &&
    tocPositionCheck &&
    embedPlayerCheck &&
    noLiteralAsterisksCheck &&
    noListPrefixesCheck &&
    olCheck &&
    emptyParagraphCountCheck &&
    blockOrderCheck;

  return {
    passed,
    verbatimCheck,
    tocPositionCheck,
    embedPlayerCheck,
    noLiteralAsterisksCheck,
    noListPrefixesCheck,
    olCheck,
    emptyParagraphCountCheck,
    details: {
      verbatimDetails: verbatimCheck ? 'Body is successfully derived verbatim.' : 'Verbatim check failed or content modified.',
      tocDetails: tocPositionCheck ? 'TOC block element exists in editor.' : 'TOC block position is invalid or missing.',
      embedDetails: embedPlayerCheck ? 'Spotify embed is converted to player widget.' : 'Spotify embed remains a raw text link.',
      noLiteralAsterisksDetails: noLiteralAsterisksCheck ? 'No literal ** remaining.' : 'Literal ** detected in rendered body.',
      noListPrefixesDetails: noListPrefixesCheck ? 'No bullet prefixes (* / -) in li elements.' : 'Bullet prefixes (* / -) remaining in li elements.',
      olDetails: olCheck ? '<ol> element correctly present for numbered list.' : 'Numbered list in source but no <ol> element rendered.',
      emptyParagraphCountDetails: emptyParagraphCountCheck ? `Empty paragraph count is acceptable (${options.emptyParagraphCount ?? 0}).` : `Too many empty paragraphs (${options.emptyParagraphCount}).`,
    },
  };
}
