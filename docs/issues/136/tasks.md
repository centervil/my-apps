# Tasks - Issue #136: パイプライン管理用プライベートリポジトリの構築

## フェーズ 1: リポジトリの初期化 (GitHub 側操作)
- [x] GitHub 上にプライベートリポジトリ `private-ops` を作成
- [x] ローカルにクローン、または初期ファイルをプッシュ
- [ ] `my-apps` 連携用の Fine-grained PAT の発行（Actions: Write 権限） ※ユーザー作業

## フェーズ 2: ディレクトリ構造と設定ファイルの作成
- [x] `configs/spotify/` ディレクトリの作成
- [x] テスト用番組設定 (`test-show.json`) の作成
- [x] 本番用番組設定の雛形作成

## フェーズ 3: 連携ワークフローの定義
- [x] `.github/workflows/spotify-automation.yml` の作成
- [x] `repository_dispatch` イベントへの対応
- [x] `runs-on: self-hosted` の指定
- [x] `my-apps` リポジトリのクローン・セットアップ処理の記述

## フェーズ 4: 疎通確認
- [ ] `my-apps` 側からテスト用 dispatch を送信し、ジョブが起動することを確認
- [ ] セルフホストランナー上でログが出力されることを確認