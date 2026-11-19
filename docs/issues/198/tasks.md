# タスクリスト: Issue #198 日次ルーチンの本番適用

- [ ] `.gitignore` への `credentials/note-auth.json` 追加確認・追記
- [ ] `src/utils/paths.ts` への `getNoteAuthPath()` 追加
- [ ] note 初回認証スクリプト `scripts/saveNoteAuth.ts` の作成
- [ ] `package.json` への `"login:note"` スクリプト追加
- [ ] note 下書き作成 CLI `src/noteCli.ts` の実装
- [ ] シェルスクリプト `scripts/note.sh` の作成
- [ ] `package.json` への `"note-draft"` スクリプト追加
- [ ] 単体テストコードの作成（CLI 引数検証、エラーハンドリング、dry-run 等）
- [ ] `README.md` への「本番実行手順」節の追加
- [ ] 単体テストおよび lint の実行・通過確認
- [ ] 実機検証の実施（Spotify アップロード & note CLI エラー/ドライラン検証）
- [ ] 開発ログの作成 (`development_logs/2026-11-19-issue-198-session-1.md`)
- [ ] コミットおよび PR 作成
