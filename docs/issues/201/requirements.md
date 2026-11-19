# Issue 201: NoteEditorPage セレクタの不具合修正と実機検証

## 概要
#198（PR #200）で実装した note 下書き作成 CLI (`src/noteCli.ts`) を実認証で実行したところ、`NoteEditorPage.ts` のセレクタが実際の note エディタと一致せず、タイムアウトエラー（終了コード 1）となった。本Issueでは、実際の note エディタ DOM に合わせて `NoteEditorPage` の全メソッドを監査・修正し、下書き作成および品質チェックを正常に機能させる。

## ユーザー要件 (Requirements)
1. **NoteEditorPage の監査・修正**:
   - `navigateToNewNote`: `https://editor.note.com/new` にアクセスし、自動作成されたエディタページ（URL が `https://editor.note.com/notes/<noteId>/edit/` に遷移）を正しく検出する。
   - `setTitle`: タイトル欄（TEXTAREA, placeholder="記事タイトル"）への入力が確実に行われるようにする。
   - `setBodyAndEmbed`: ProseMirror の contenteditable な DIV (`class: "ProseMirror note-common-styles__textnote-body"`) への本文入力および Spotify 番組 URL の埋め込みプレイヤー変換が正しく行われるようにする。
   - 品質チェック3点（本文 verbatim、目次位置、埋め込みプレイヤー変換）および「下書き保存」ボタンの操作が正しく動作すること（公開は絶対にしない）。
2. **CLI 結果 JSON の拡張**:
   - `src/noteCli.ts` の出力する結果 JSON（details）に、下書きの編集 URL と note ID（編集 URL から抽出）を含めること。
3. **単体テストの追加**:
   - ブラウザ不要で検証できる部分（note ID の URL からの抽出など）に対する単体テストを追加すること。既存テストおよび lint が通ること。
4. **実機検証**:
   - ワークツリーで `note-draft` CLI を実行し、テスト下書きを1件作成する。
   - 条件: `--contentType study`, ソースは適当なテスト用 markdown (`/tmp/test-note.md` 等), `--seriesName 動作確認`, `--dayNumber 1`, `--spotifyShowUrl https://open.spotify.com/show/1ptW7cCcrt1Qb3QinuKHc5`。
   - 期待結果: 終了コード 0、結果 JSON に品質チェック3点の結果と下書き URL が含まれること。
