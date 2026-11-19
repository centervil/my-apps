# 設計書: 日次配信の定時起動オーケストレーター (Issue #181)

## 1. アーキテクチャとモジュール分割
`apps/ui-automations/spotify-automation` 内に以下のモジュール群を新規実装する：
- `src/orchestrator/targets.ts`: 系統ごとの対象確定、日付計算 (UTC+9 固定オフセット)、SSOT (`podcast-ssot.yaml`) パース (`js-yaml` 使用) の純粋関数群と単体テスト。
- `src/orchestrator/report.ts`: 状態ファイルの読み書き、レポート構造体の組み立て、終了コード判定。
- `src/orchestrator.ts`: CLI エントリ。引数解析 (`--date`, `--dryRun`, `--docsDir`)、音声チェック、AuthManager 検証、子プロセスによる CLI 実行、レポート書き出しを統括。
- `package.json`: npm スクリプト `"daily-publish": "tsx src/orchestrator.ts"` の追加。

## 2. ワークフローとフォールバック
- `.github/workflows/daily-publish.yml`: schedule (`*/30 20-23,0-1 * * *`) と workflow_dispatch。concurrency `daily-publish`。my-apps と my-docs の checkout、pnpm install、オーケストレーター実行、artifact アップロード。
- `apps/ui-automations/spotify-automation/scripts/daily-publish-fallback.sh`: OCI ホスト用 `gh workflow run` スクリプト。
- `docs/daily-podcast-runbook.md`: 運用手順書。

## 3. テスト戦略
- targets.ts, report.ts の網羅的単体テスト (`vitest` を想定、既存プロジェクトのテストランナーに合わせる)。
- `--dryRun` によるスモーク検証。
