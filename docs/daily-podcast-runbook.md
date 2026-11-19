# Daily Podcast Runbook

## 1. 概要
日次配信（学習記事 `study` およびサイバーセキュリティニュース `news`）の定時自動起動、音声 inbox 規約、オーケストレーターの動作、フォールバック手順について記載する。

## 2. アーキテクチャとスケジュール
- **実行トリガー**: GitHub Actions `schedule` (JST 05:00〜10:00 の30分間隔) および `workflow_dispatch`。
- **実行基盤**: Self-hosted Runner (`github-runner`、OCI ホスト)。
- **オーケストレーター**: `apps/ui-automations/spotify-automation/src/orchestrator.ts`

## 3. 音声 inbox 規約
- **置き場所**: `/home/devuser/workspace/daily-audio/<YYYY-MM-DD>/` (環境変数 `DAILY_AUDIO_DIR` で変更可)
- **ファイル名**:
  - `study.m4a` または `study.mp3`
  - `news.m4a` または `news.mp3`
- **任意メタデータ**: `meta.json`
  ```json
  {
    "studyTitle": "テーマ名 DayN",
    "newsTitle": "2026年11月18日サイバーセキュリティニュース"
  }
  ```

## 4. 状態管理と冪等性
- **状態保存先**: `/home/devuser/workspace/daily-publish-state/<YYYY-MM-DD>.json`
- 成功した工程は同日内の再実行でスキップされ、二重投稿が防止される。

## 5. フォールバック手順
GitHub Actions のスケジュール遅延や障害時に、OCI ホストの cron 等からワークフローを手動発火させる場合：
```bash
cd /path/to/my-apps/apps/ui-automations/spotify-automation/scripts
./daily-publish-fallback.sh [YYYY-MM-DD] [true/false]
```
