# 設計書: spotify-automation CLI の定期実行ワークフロー

## 1. はじめに

本ドキュメントは、spotify-automation CLI を self-hosted runner で定期実行する GitHub Actions ワークフローの技術設計を定義します。

## 2. アーキテクチャ

- **トリガー**: スケジュール実行 (`schedule`) を使用し、毎日定時にワークフローをトリガーします。
- **実行環境**: `self-hosted` ラベルを持つランナーを指定し、特定の物理マシンまたはVM上でジョブを実行します。
- **認証**: Spotify APIへの認証情報は、GitHub Secrets (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`) を利用して安全に管理します。
- **スクリプト実行**: ワークフローは、リポジトリ内の `apps/ui-automations/spotify-automation/scripts/upload.sh` スクリプトを呼び出します。

## 3. 実装方針

### 3.1. ワークフローファイル

- **ファイル名**: `.github/workflows/spotify-upload.yml`
- **トリガー設定**:
  ```yaml
  on:
    schedule:
      - cron: '0 0 * * *' # 毎日 00:00 (UTC)
    workflow_dispatch: # 手動実行用
  ```
- **ジョブ設定**:
  - `runs-on: self-hosted` を指定します。
  - リポジトリのチェックアウトを行います。
  - Node.js, pnpm のセットアップを行います。
  - `pnpm install` を実行して依存関係をインストールします。
  - `upload.sh` スクリプトを実行します。

### 3.2. スクリプトへの引数渡し

ワークフローから `upload.sh` スクリプトへ引数を渡すために、`with` キーワードまたは環境変数を使用します。
`showId`, `audioPath`, `title` などの設定値は、ワークフローファイル内で直接定義するか、Variables を使用して管理します。

```yaml
- name: Run upload script
  env:
    SPOTIFY_CLIENT_ID: ${{ secrets.SPOTIFY_CLIENT_ID }}
    SPOTIFY_CLIENT_SECRET: ${{ secrets.SPOTIFY_CLIENT_SECRET }}
    SPOTIFY_REFRESH_TOKEN: ${{ secrets.SPOTIFY_REFRESH_TOKEN }}
  run: |
    bash apps/ui-automations/spotify-automation/scripts/upload.sh \
      --show-id "your_show_id" \
      --audio-path "/path/to/your/audio.mp3" \
      --title "Episode Title" \
      --description "Episode Description"
```

## 4. テスト戦略

- **手動実行**: `workflow_dispatch` トリガーを利用して、開発ブランチでワークフローを手動実行し、動作を確認します。
- **ログ確認**: ワークフローの実行ログを詳細に確認し、各ステップが正常に完了していること、特にスクリプト実行時の出力やエラーメッセージを監視します。
- **アップロード確認**: 実際にSpotify for Podcastersにエピソードがアップロードされているかを目視で確認します。
