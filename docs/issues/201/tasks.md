# Issue 201 タスクリスト (tasks.md)

- [ ] 1. `NoteEditorPage.ts` の DOM セレクタおよびメソッドの修正・監査
  - [ ] 1.1 `navigateToNewNote` での `/notes/<noteId>/edit/` への遷移検知と `noteId` 抽出の実装
  - [ ] 1.2 `setTitle` での正しい textarea セレクタ (`textarea[placeholder="記事タイトル"]`) の確認・修正
  - [ ] 1.3 `setBodyAndEmbed` での ProseMirror (`div.ProseMirror`) への本文入力および Spotify 埋め込みプレイヤー変換の安定化
  - [ ] 1.4 品質チェック3点および「下書き保存」ボタンの動作確認（※公開は絶対にしない）
- [ ] 2. `src/noteCli.ts` の結果 JSON（details）への `noteId` および `draftUrl` 追加
- [ ] 3. 単体テストの追加と既存テストのパス確認
  - [ ] 3.1 note ID 抽出やエディタページ関連の単体テスト実装
  - [ ] 3.2 ユニットテスト実行 (`nx run spotify-automation:test` 等)
- [ ] 4. 実機検証の実施
  - [ ] 4.1 テスト用マークダウンファイル作成 (`/tmp/test-note.md`)
  - [ ] 4.2 `note-draft` CLI の実機実行（`credentials/note-auth.json` 使用）
  - [ ] 4.3 終了コード 0、結果 JSON の品質チェック3点・下書き URL 確認
- [ ] 5. 開発ログ作成 (`development_logs/2026-11-19-issue-201-session-1.md`) と PR 作成
