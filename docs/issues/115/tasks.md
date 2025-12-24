# Tasks - Issue 115: 開発環境コンテナにおけるPlaywright実行環境とNx設定の整備

## 1. 調査と準備
- [ ] 現状の `.devcontainer/devcontainer.json` と `Dockerfile` の内容を確認する
- [ ] `apps/ui-automations/spotify-automation/` 配下の Playwright 設定を確認する
- [ ] `scripts/collect-audit-context.ts` の依存関係と実行エラーの内容を特定する

## 2. DevContainer 設定の修正
- [ ] `.devcontainer/devcontainer.json` に `postCreateCommand` を追加（または修正）し、Playwright ブラウザをインストールするようにする
- [ ] `gh` CLI 認証情報を永続化するためのマウント設定または Feature 設定を追加する
- [ ] (必要であれば) `Dockerfile` に必要なシステムパッケージ（libgbm等）を追加する

## 3. Nx プロジェクト設定の修正
- [ ] `apps/ui-automations/spotify-automation/project.json` に `e2e` ターゲットを追加する
- [ ] `nx e2e spotify-automation` が動作するように、パスやコンフィグを調整する

## 4. スクリプト実行環境の整備
- [ ] `tsx` がインストールされているか確認し、なければ `devDependencies` に追加する
- [ ] `scripts/collect-audit-context.ts` を `tsx` で実行できるように調整する

## 5. 動作検証
- [ ] DevContainer を再ビルドし、初期状態でブラウザが使用可能か確認する
- [ ] `nx e2e spotify-automation --headed=false` を実行してパスすることを確認する
- [ ] 監査スクリプトを実行して正常に終了することを確認する
- [ ] コンテナ再起動後も `gh` CLI がログイン状態であることを確認する
