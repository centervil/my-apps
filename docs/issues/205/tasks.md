# Tasks: Issue 205

- [ ] 1. 実際の note エディタ画面を操作して、公開フロー（「公開に進む」～公開設定～投稿ボタン）のDOMセレクタを確認・確定する
- [ ] 2. `NoteEditorPage.ts` に以下のメソッドを追加・拡張する
  - `setEyecatchImageFromPreviousNote(previousNoteId: string)`
  - `publishNote(tags?: string[], magazineName?: string)`
- [ ] 3. `src/noteCli.ts` に `--publish`, `--tags`, `--magazine` オプションを追加し、公開フローおよび品質チェック不合格時の処理（status: QUALITY_CHECK_FAILED, exitCode: 1）を実装する
- [ ] 4. 単体テストの追加と既存テストの確認 (`npx nx test spotify-automation`)
- [ ] 5. 実機検証の実施:
  - 5-1. テスト記事（タイトル「動作確認」含む）で `--publish` 付き通しテストを実行し、公開 URL を確認
  - 5-2. 不正URLによる品質チェック落ちテスト（公開されないこと、exit 1）を確認
  - 5-3. `--publish` なしの従来実行（下書き停止）を確認
- [ ] 6. 開発ログ (`development_logs/2026-11-19-issue-205-session-1.md`) の作成
- [ ] 7. コミット、プッシュ、PR作成
