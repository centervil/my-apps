# 開発環境コンテナにおけるPlaywright実行環境とNx設定の整備

## 概要
現在、開発環境（DevContainer）において `spotify-automation` プロジェクトのE2Eテストや監査スクリプトが正常に動作しない状態です。
本Issueでは、開発環境のコンテナ設定を修正し、コンテナ立ち上げ直後からこれらのテストやスクリプトが実行可能な状態にすることをゴールとします。

## 現状の課題
1. **Playwrightブラウザの欠如**: コンテナ内にPlaywright用のブラウザバイナリがインストールされておらず、`npx playwright test` が失敗する。
2. **Nxターゲットの未定義**: `project.json` に `e2e` ターゲットがなく、`nx e2e spotify-automation` が実行できない。
3. **スクリプト実行環境の不備**: `scripts/collect-audit-context.ts` が `ts-node` の設定等の問題で実行できない。
4. **GitHub認証の非永続化**: コンテナを再起動すると `gh` CLI の認証情報がクリアされてしまい、再ログインが必要になる。

## ゴール
開発環境のコンテナ設定（`.devcontainer` 配下や `project.json`）を修正し、以下の状態を達成する。
1. コンテナ構築時（または初期化時）にPlaywrightのブラウザが自動的にインストールされる。
2. `nx e2e spotify-automation` コマンドでE2Eテストが実行できる。
3. 監査用スクリプトが正常に実行できる。
4. コンテナ再起動後も GitHub CLI の認証状態が維持される（または認証情報の注入が自動化される）。

## 必要な作業
- [ ] `.devcontainer/Dockerfile` または `devcontainer.json` の `postCreateCommand` に `npx playwright install --with-deps` 相当の処理を追加する。
- [ ] `apps/ui-automations/spotify-automation/project.json` に `e2e` ターゲットを追加する。
- [ ] `scripts/collect-audit-context.ts` を実行できるように `ts-node` 設定を見直すか、`tsx` を導入する。
- [ ] `.devcontainer` 設定を見直し、`gh` CLI の認証情報（設定ファイルや環境変数）を永続化するか、ホスト側の認証情報をマウントする設定を追加する。