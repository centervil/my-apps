# Requirements: ブラウザバイナリパスの環境変数化

## User Stories

- **As a** 開発者 (Developer)
- **I want** アプリケーションがブラウザのバイナリパスをハードコードせず、環境変数またはデフォルトの解決ロジックを使用するようにしたい
- **So that** DevContainer以外の環境（ローカルマシン、CI/CD環境）でも設定を変更せずにツールを実行できる

## Acceptance Criteria

- [ ] `src/features/spotifyUploader.ts` から `/ms-playwright` へのハードコードされた依存が削除されていること。
- [ ] `process.env.PLAYWRIGHT_BROWSERS_PATH` が設定されている場合、その値が尊重されること。
- [ ] `process.env.PLAYWRIGHT_BROWSERS_PATH` が未設定の場合、Playwrightの標準的なブラウザ解決ロジックが機能すること。
- [ ] `tests/e2e/cli.spec.ts` 内のハードコードされた `/ms-playwright` 設定が削除または適切に環境変数化されていること。
- [ ] 変更後も DevContainer 環境での動作（アップロード、テスト）が正常に行えること（既存機能の回帰がないこと）。
