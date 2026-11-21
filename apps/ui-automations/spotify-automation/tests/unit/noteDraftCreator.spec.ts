import { test, expect } from '@playwright/test';
import { convertMarkdownToHtml, convertMarkdownToNoteBody, buildNoteContent, performQualityCheck, derivePublishedUrl, extractKeyFromUrl, verifyMagazineAppliedFromApi } from '../../src/features/noteDraftCreator';

test.describe('Note Draft Creator Unit Tests', () => {
  test('convertMarkdownToHtml should handle heading mapping correctly', () => {
    const raw = '## 📚 今日のテーマ\nSome intro\n## 📖 解説\nDetails\n### サブトピック\nText\n#### マイナー';
    const html = convertMarkdownToHtml('study', raw);
    expect(html).toContain('<h3>📚 今日のテーマ</h3>');
    expect(html).toContain('<h2>📖 解説</h2>');
    expect(html).toContain('<h3>サブトピック</h3>');
    expect(html).toContain('<h3>マイナー</h3>');
  });

  test('convertMarkdownToHtml should handle ul and ol lists correctly', () => {
    const raw = '* Item A\n- Item B\n1. First\n2. Second';
    const html = convertMarkdownToHtml('study', raw);
    expect(html).toContain('<ul><li>Item A</li><li>Item B</li></ul>');
    expect(html).toContain('<ol><li>First</li><li>Second</li></ol>');
  });

  test('convertMarkdownToHtml should handle bold text and bold-only lines', () => {
    const raw = '**Bold Title**\nNormal text with **strong** word.';
    const html = convertMarkdownToHtml('study', raw);
    expect(html).toContain('<p><strong>Bold Title</strong><br>Normal text with <strong>strong</strong> word.</p>');
  });

  test('convertMarkdownToHtml should process numbered lists directly following a paragraph without empty line', () => {
    const raw = 'Paragraph line\n1. First item\n2. Second item';
    const html = convertMarkdownToHtml('study', raw);
    expect(html).toContain('<p>Paragraph line</p>');
    expect(html).toContain('<ol><li>First item</li><li>Second item</li></ol>');
  });

  test('convertMarkdownToHtml should eliminate unnecessary empty paragraphs for empty lines', () => {
    const raw = 'Line 1\n\n\nLine 2';
    const html = convertMarkdownToHtml('study', raw);
    expect(html).toBe('<p>Line 1</p><p>Line 2</p>');
    expect(html).not.toContain('<p></p>');
  });

  test('convertMarkdownToNoteBody should correctly map headings for study content', () => {
    const raw = '## 📚 今日のテーマ\nSome intro\n## 📖 解説\nDetails\n### サブトピック\nText';
    const converted = convertMarkdownToNoteBody('study', raw);
    expect(converted).toContain('<h3>📚 今日のテーマ</h3>');
    expect(converted).toContain('<h2>📖 解説</h2>');
    expect(converted).toContain('<h3>サブトピック</h3>');
  });

  test('convertMarkdownToNoteBody should omit top-level heading for news content', () => {
    const raw = '# 2025年6月10日 ニュースまとめ\n## ニュース概要\nDetails';
    const converted = convertMarkdownToNoteBody('news', raw);
    expect(converted).not.toContain('2025年6月10日 ニュースまとめ');
    expect(converted).toContain('<h2>ニュース概要</h2>');
  });

  test('buildNoteContent should build correct structure with template, embed, TOC, and body', () => {
    const result = buildNoteContent({
      contentType: 'study',
      sourceContent: '## 📚 テーマ\n本文です',
      seriesName: 'AP',
      dayNumber: 11,
      spotifyShowUrl: 'https://open.spotify.com/show/12345',
    });

    expect(result.title).toBe('AP Day11');
    expect(result.body.startsWith('この記事の内容はPodCastとしても配信しています')).toBe(true);
    expect(result.body).toContain('https://open.spotify.com/show/12345');
    expect(result.body).toContain('目次');
    expect(result.body).toContain('<h3>📚 テーマ</h3>');
  });

  test('performQualityCheck should pass when all strict conditions are met', () => {
    const source = '## 📚 テーマ\n1. 項目1\nテスト本文のコンテンツ。';
    const rendered = `この記事の内容はPodCastとしても配信しています。
https://open.spotify.com/show/12345
目次
### 📚 テーマ
1. 項目1
テスト本文のコンテンツ。`;

    const qc = performQualityCheck(source, rendered, true, {
      hasTocElement: true,
      hasOlElement: true,
      emptyParagraphCount: 2,
      hasLiteralAsterisks: false,
      hasListPrefixesInLi: false,
    });
    expect(qc.passed).toBe(true);
    expect(qc.verbatimCheck).toBe(true);
    expect(qc.tocPositionCheck).toBe(true);
    expect(qc.embedPlayerCheck).toBe(true);
    expect(qc.noLiteralAsterisksCheck).toBe(true);
    expect(qc.noListPrefixesCheck).toBe(true);
    expect(qc.olCheck).toBe(true);
    expect(qc.emptyParagraphCountCheck).toBe(true);
  });

  test('performQualityCheck should fail if strict checks detect quality issues', () => {
    const source = '## 📚 テーマ\n1. 項目1\n**太字**';
    const rendered = `本文
**太字**
* リスト先頭記号`;

    const qc = performQualityCheck(source, rendered, true, {
      hasTocElement: false,
      hasOlElement: false,
      emptyParagraphCount: 8,
      hasLiteralAsterisks: true,
      hasListPrefixesInLi: true,
    });

    expect(qc.passed).toBe(false);
    expect(qc.tocPositionCheck).toBe(false);
    expect(qc.noLiteralAsterisksCheck).toBe(false);
    expect(qc.noListPrefixesCheck).toBe(false);
    expect(qc.olCheck).toBe(false);
    expect(qc.emptyParagraphCountCheck).toBe(false);
  });

  test('derivePublishedUrl should construct correct public URL when apiData has user.urlname and key', () => {
    const apiData = {
      data: {
        key: 'n0e484c8e0206',
        user: {
          urlname: 'clever_chives813'
        }
      }
    };
    const fallback = 'https://editor.note.com/notes/n0e484c8e0206/publish/';
    const result = derivePublishedUrl(apiData, fallback);
    expect(result).toBe('https://note.com/clever_chives813/n/n0e484c8e0206');
  });

  test('derivePublishedUrl should fall back to fallbackEditorUrl if apiData is missing urlname or key', () => {
    const apiData = { data: { key: 'n0e484c8e0206' } };
    const fallback = 'https://editor.note.com/notes/n0e484c8e0206/publish/';
    const result = derivePublishedUrl(apiData, fallback);
    expect(result).toBe(fallback);
  });

  test('extractKeyFromUrl should correctly extract note key from various URL formats', () => {
    expect(extractKeyFromUrl('https://editor.note.com/notes/n9437b0fb5854/edit/')).toBe('n9437b0fb5854');
    expect(extractKeyFromUrl('https://note.com/clever_chives813/n/n9437b0fb5854')).toBe('n9437b0fb5854');
    expect(extractKeyFromUrl('invalid-url')).toBeNull();
  });

  test('verifyMagazineAppliedFromApi should return true when belonging_magazine_keys is non-empty', () => {
    const apiDataWithData = {
      data: {
        belonging_magazine_keys: ['m709ca5680512'],
      },
    };
    expect(verifyMagazineAppliedFromApi(apiDataWithData)).toBe(true);

    const apiDataRoot = {
      belonging_magazine_keys: ['m709ca5680512'],
    };
    expect(verifyMagazineAppliedFromApi(apiDataRoot)).toBe(true);
  });

  test('verifyMagazineAppliedFromApi should return false when belonging_magazine_keys is empty or missing', () => {
    const apiDataEmpty = {
      data: {
        belonging_magazine_keys: [],
      },
    };
    expect(verifyMagazineAppliedFromApi(apiDataEmpty)).toBe(false);

    const apiDataMissing = {
      data: {},
    };
    expect(verifyMagazineAppliedFromApi(apiDataMissing)).toBe(false);
  });
});
