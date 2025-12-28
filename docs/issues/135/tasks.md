# Tasks - Issue #135: セルフホストランナー用 Dockerfile の作成と環境構築

## フェーズ 1: Docker 資産の準備
- [x] `apps/infra/self-hosted-runner/` ディレクトリを作成
- [x] `.devcontainer/Dockerfile` をベースにした `Dockerfile` の作成
- [x] GitHub Runner Agent のインストール手順を追加
- [x] noVNC のインストールと設定の追加

## フェーズ 2: 起動スクリプトの実装
- [x] `entrypoint.sh` の作成
- [x] GitHub への登録処理 (config.sh) の組み込み
- [x] リポジトリの自動クローン処理の実装
- [x] `pnpm` セットアップ処理の組み込み

## フェーズ 3: 動作確認
- [ ] ローカルでの Docker ビルド試行
- [ ] コンテナの起動とログの確認
- [ ] VNC/noVNC 経由での接続テスト
- [ ] GitHub Actions 側でのステータス確認 (Idle になること)
- [ ] 簡単なテストジョブの実行テスト