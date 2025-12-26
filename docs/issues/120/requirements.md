# Requirements: Playwright Browser Installation Setup

## 1. 概要 (Overview)
`spotify-automation` プロジェクトにおいて、初期セットアップ時およびCI環境での実行時にPlaywrightブラウザのバイナリが不足しており、テストや実行が失敗する問題を解消する。

## 2. ユーザーストーリー (User Stories)

### US1: ローカル環境セットアップの明確化
- **As a** 開発者
- **I want to** READMEの手順に従うだけで必要なPlaywrightブラウザがインストールされることを知りたい
- **So that** エラーなくローカルでテストや開発を開始できる

### US2: CI環境での自動セットアップ
- **As a** CIシステム
- **I want to** テスト実行前にPlaywrightブラウザを自動的にインストールしたい
- **So that** 環境差異によるテスト失敗を防ぎ、安定したビルドプロセスを維持できる

## 3. 受け入れ基準 (Acceptance Criteria)

- [ ] **READMEの更新**: `apps/ui-automations/spotify-automation/README.md` に `pnpm exec playwright install` の実行手順が明記されていること。
- [ ] **CIワークフローの更新**: `.github/workflows/ci.yml` に Playwrightブラウザのインストールステップ (`pnpm exec playwright install`) が追加されていること。
- [ ] **E2Eテストの通過**: 変更後のCI環境において、`spotify-automation` のE2Eテストがエラー（"Executable doesn't exist..."）なく開始されること。
