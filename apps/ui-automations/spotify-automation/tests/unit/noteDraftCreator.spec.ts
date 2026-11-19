import { test, expect } from '@playwright/test';
import { convertMarkdownToNoteBody, buildNoteContent, performQualityCheck, derivePublishedUrl } from '../../src/features/noteDraftCreator';

test.describe('Note Draft Creator Unit Tests', () => {
  test('convertMarkdownToNoteBody should correctly map headings for study content', () => {
    const raw = '## 📚 今日のテーマ\nSome intro\n## 📖 解説\nDetails\n### サブトピック\nText';
    const converted = convertMarkdownToNoteBody('study', raw);
    expect(converted).toContain('### 📚 今日のテーマ');
    expect(converted).toContain('## 📖 解説');
    expect(converted).toContain('### サブトピック');
  });

  test('convertMarkdownToNoteBody should omit top-level heading for news content', () => {
    const raw = '# 2025年6月10日 ニュースまとめ\n## ニュース概要\nDetails';
    const converted = convertMarkdownToNoteBody('news', raw);
    expect(converted).not.toContain('2025年6月10日 ニュースまとめ');
    expect(converted).toContain('## ニュース概要');
  });

  test('buildNoteContent should build correct structure with template, embed, TOC, and body', () => {
    const result = buildNoteContent({
      contentType: 'study',
      sourceContent: '## 📚 テーマ\n本文です',
      seriesName: 'AP',
      dayNumber: 11,
      spotifyShowUrl: 'https://open.spotify.com/show/12345',
    });

    expect(result.title).toBe('AP 30日間学習Day11');
    expect(result.body.startsWith('この記事の内容はPodCastとしても配信しています')).toBe(true);
    expect(result.body).toContain('https://open.spotify.com/show/12345');
    expect(result.body).toContain('目次');
    expect(result.body).toContain('### 📚 テーマ');
  });

  test('performQualityCheck should pass when verbatim, TOC position, and embed player are valid', () => {
    const source = '## 📚 テーマ\nテスト本文のコンテンツがここに続きます。';
    const rendered = `この記事の内容はPodCastとしても配信しています。
https://open.spotify.com/show/12345
目次
### 📚 テーマ
テスト本文のコンテンツがここに続きます。`;

    const qc = performQualityCheck(source, rendered, true);
    expect(qc.passed).toBe(true);
    expect(qc.verbatimCheck).toBe(true);
    expect(qc.tocPositionCheck).toBe(true);
    expect(qc.embedPlayerCheck).toBe(true);
  });

  test('performQualityCheck should fail if TOC is missing or embed is not converted', () => {
    const source = '## 📚 テーマ\nテスト本文のコンテンツがここに続きます。';
    const rendered = `この記事の内容はPodCastとしても配信しています。
https://open.spotify.com/show/12345
### 📚 テーマ
テスト本文のコンテンツがここに続きます。`;

    const qc = performQualityCheck(source, rendered, false);
    expect(qc.passed).toBe(false);
    expect(qc.tocPositionCheck).toBe(false);
    expect(qc.embedPlayerCheck).toBe(false);
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
});
