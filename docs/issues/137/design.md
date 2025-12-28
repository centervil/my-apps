# Design - Issue #137: 番組別パイプラインの実装と認証フローの確立

## アーキテクチャ

### 実行フロー
1. **Trigger**: `my-apps` (User) -> `trigger-private-dispatch.sh` -> `private-ops` (Repo Dispatch)
2. **Orchestrator**: `private-ops` Workflow -> Reads `configs/spotify/xxx.json`
3. **Runner**: `docker-runner` (Self-hosted)
    - `git clone/pull` my-apps (Latest)
    - `pnpm install`
    - `pnpm nx run spotify-automation:upload --showId=... --inputFile=...

## 実装方針

### 1. `private-ops` ワークフローの改良
`spotify-automation.yml` を更新し、CLI ツールへの具体的なコマンド呼び出しを実装する。

```yaml
run: |
  # 設定値の取得 (jqを使用)
  CONFIG_PATH="${{ github.workspace }}/configs/spotify/${CONFIG_FILE}"
  SHOW_ID=$(jq -r '.spotify_show_id' $CONFIG_PATH) 
  
  # 実行
  cd /home/devuser/workspace/my-apps
  pnpm nx run spotify-automation:upload \
    --showId "$SHOW_ID" \
    --inputFile "/home/devuser/workspace/assets/audio/test_episode.mp3" \
    --title "Automated Upload Test" \
    --description "Uploaded via self-hosted runner" \
    --headless
```
※ `inputFile` はテスト用に固定ファイル、またはダウンロードロジックを追加する。今回はテスト用ダミーファイルをコンテナ内に配置する運用とする。

### 2. 認証情報の管理
- **初回**: VNC で接続 -> `pnpm nx run spotify-automation:upload --headless=false` (または専用のログインスクリプト) を実行 -> ログイン -> 終了（認証ファイル保存）。
- **自動実行**: 保存された `.auth/spotify-auth.json` を使用して実行。

## テスト戦略
1. **認証セットアップ**: VNC 経由で手動ログインを実施。
2. **疎通テスト**: `trigger-private-dispatch.sh` を実行し、テスト用番組へのアップロードを試行。
3. **結果確認**: ログを確認し、エラー（特に認証切れやセレクタエラー）がないか確認。

```