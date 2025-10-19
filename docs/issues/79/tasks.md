---
title: "タスクリスト: spotify-automationプロジェクトのCI改善"
---

## 概要

本タスクリストは、Issue #79「`ci(spotify-automation): PRごとに静的解析を実行できるようCIを改善する`」の実現に向けた具体的な作業を定義する。

## 作業タスク

### フェーズ1: CIワークフローの修正

- [ ] `.github/workflows/ci.yml` ファイルを開き、内容を編集する。
- [ ] `on:` トリガーを、`main`ブランチへの `push` と `pull_request` の両方で実行されるように修正する。
- [ ] 既存の `test` ジョブの名前を `lint` に変更する。
- [ ] ジョブレベルで設定されている `if: ${{ github.event_name != 'pull_request' }}` の条件分岐を削除する。
- [ ] Playwrightの依存関係をインストールするステップ (`Run Playwright install-deps`) を削除する。
- [ ] Playwrightのブラウザをインストールするステップ (`Run Playwright install`) を削除する。
- [ ] Playwrightのテストを実行するステップ (`Run Playwright test`) を削除する。
- [ ] テストレポートをアップロードするステップ (`Upload test report`) を削除する。
- [ ] `lint` ジョブのステップが `checkout`, `setup pnpm`, `setup node`, `install dependencies`, `run lint` のみで構成されていることを確認する。

### フェーズ2: 動作検証

- [ ] 修正した `ci.yml` を含むブランチをリモートリポジトリにプッシュする。
- [ ] `main` ブランチをターゲットとして、新しいプルリクエストを作成する。
- [ ] GitHub Actionsの実行結果を確認し、`lint` ジョブが自動的に開始され、すべてのステップが成功することを確認する。
- [ ] （オプション）意図的にLintエラーを発生させるコミットを追加でプッシュし、CIジョブが正しく失敗することを検証する。
- [ ] プルリクエストをマージし、`main`ブランチで `lint` ジョブが再度実行され、成功することを確認する。

### フェーズ3: クリーンアップとドキュメント

- [ ] 作業ブランチを削除する。
- [ ] 必要に応じて、`README.md` や関連ドキュメントにCIプロセスの変更点を反映する（本Issueでは不要）。
