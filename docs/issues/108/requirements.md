# 要件定義書: spotify-automation CLI の定期実行ワークフロー

## 1. 概要

本ドキュメントは、Spotify Automation の CLI ツールを self-hosted runner 上で定期実行し、指定されたパスからポッドキャストのエピソードを自動でアップロードするための GitHub Actions ワークフローの要件を定義する。

## 2. ユーザーストーリー

- **As a** developer
- **I want to** run the `spotify-automation` CLI tool on a schedule using a self-hosted runner
- **So that I can** automatically upload podcast episodes from a specified path on the runner machine

## 3. 受け入れ基準

- `.github/workflows/` 配下に GitHub Actions ワークフローのファイルが作成されていること。
- ワークフローはスケジュール（例: 毎日）でトリガーされること。
- ジョブは `self-hosted` ラベルの付いた runner で実行されること。
- ワークフローが `apps/ui-automations/spotify-automation/scripts/upload.sh` スクリプトを正常に実行すること。
- スクリプトに渡す引数（例: `showId`, `audioPath`, `title`）はワークフローに渡され、必要に応じて GitHub Secrets を利用できること。
