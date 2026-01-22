# Tasks: ブラウザバイナリパスの環境変数化

- [ ] `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` からハードコードされたパス設定ロジックを削除する
- [ ] `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts` から `PLAYWRIGHT_BROWSERS_PATH` の強制上書きを削除する
- [ ] `.devcontainer/devcontainer.json` を確認し、必要であれば `PLAYWRIGHT_BROWSERS_PATH` 環境変数を追加する
- [ ] `nx test spotify-automation` を実行し、ユニットテストが通過することを確認する
- [ ] `nx e2e spotify-automation` を実行し、E2Eテストが通過することを確認する
- [ ] 変更内容をコミットし、PRを作成する
