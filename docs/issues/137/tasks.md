# Tasks - Issue #137: 番組別パイプラインの実装と認証フローの確立

## フェーズ 1: 認証情報の取得 (ユーザー作業)
- [ ] **[Action Required]** VNC (http://localhost:6080) に接続する
- [ ] **[Action Required]** コンテナ内ターミナルで以下を実行し、テスト用ファイルを準備する (Phase 3先行)
  ```bash
  mkdir -p /home/devuser/workspace/assets/audio
  curl -L -o /home/devuser/workspace/assets/audio/test_episode.mp3 https://github.com/rafaelreis-hotmart/Audio-Sample-files/raw/master/sample.mp3
  ```
- [ ] **[Action Required]** コンテナ内ターミナルで `cd ~/workspace/my-apps` を実行
- [ ] **[Action Required]** `pnpm install` を実行（依存関係確保）
- [ ] **[Action Required]** `pnpm --filter @my-apps/spotify-automation run login` を実行
- [ ] ブラウザが起動したら Spotify にログインし、ダッシュボードが表示されるまで待機（自動保存されます）

## フェーズ 2: プライベートリポジトリのワークフロー実装
- [x] `private-ops/.github/workflows/spotify-automation.yml` を編集
- [x] `jq` を使った設定ファイルのパース処理を実装
- [x] `spotify-automation` CLI の実行コマンドを実装

## フェーズ 3: テスト用ダミーファイルの準備
- [ ] (Phase 1 に統合済み)

## フェーズ 4: 実機検証
- [ ] ホストマシン（またはGemini CLI）から `export GH_PAT_PRIVATE_OPS=... && ./scripts/trigger-private-dispatch.sh test-show.json` を実行
- [ ] ワークフローの成功を確認
- [ ] Spotify 上でエピソードが作成されているか確認