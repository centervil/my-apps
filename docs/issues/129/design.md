# Design - Issue 129

## アーキテクチャ
既存の `tests/e2e/cli.spec.ts` を拡張し、`scripts/test-cli.ts` で行っていた詳細なバリデーションテストを統合します。テスト実行には Playwright の `test` ランナーを使用し、CLI プロセスの起動には既存の `runCli` ヘルパー関数を活用します。

## 実装方針
1.  **テストケースの移植**:
    - `scripts/test-cli.ts` の各テストケースを `tests/e2e/cli.spec.ts` の `test` ブロックとして再実装します。
    - バリデーションエラーのメッセージ確認 (`stderr.includes`) を Playwright の `expect` に変換します。
2.  **テストアセットの管理**:
    - テストで使用する一時的なディレクトリやダミーの音声ファイルは、Playwright の `test.beforeAll` または各テスト内で動的に生成します。
    - `test.afterAll` または `test.afterEach` で、生成したアセットを確実に削除するようにします。
    - `cli_test_assets` のようなディレクトリを `tests/e2e/` 配下に一時的に作成するロジックを移植します。
3.  **既存コードの削除**:
    - 移植完了後、`apps/ui-automations/spotify-automation/scripts/test-cli.ts` を削除します。
    - `apps/ui-automations/spotify-automation/package.json` の `scripts` セクションから `test:cli` を削除します。

## テスト戦略
- **統合テスト (E2E)**:
    - 実際に `upload.sh` (またはラップされている CLI) を実行し、標準出力・標準エラー出力・終了コードを検証します。
    - ドライランモード (`--dryRun`) を活用し、実際に Spotify API を叩くことなくロジックを検証します。
- **検証項目**:
    - 必須引数のチェック。
    - ファイル存在チェック。
    - 最新ファイル検索ロジックの正確性。
- **実行コマンド**:
    - `npx nx e2e spotify-automation`
