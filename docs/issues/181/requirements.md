# 要件定義: 日次配信の定時起動オーケストレーターと GitHub Actions CI/CD 構築 (Issue #181)

## 1. 概要
本要件は、my-life #90「日次配信パイプラインの自動化」における「起動」工程を自動化し、毎朝の定時起動から、対象確定、音声・認証チェック、既存 Spotify/note CLI の呼び出し、進捗のレポート出力までをオーケストレートする仕組みを構築するものである。

## 2. ユースケースと要件
- **定時自動起動**: GitHub Actions の `schedule` (JST 05:00〜10:00 の30分間隔) および `workflow_dispatch` により Self-hosted Runner で実行される。
- **対象系統**: `study` (学習記事) および `news` (サイバーセキュリティニュース) の2系統。
- **対象確定 (Pure Functions)**:
  - `study`: targetDay = min(spotify_day, note_day) + 1。ソース教材ファイルが存在しなければ `SOURCE_MISSING`。
  - `news`: targetDate = 実行日の前日 (JST)。完了済みならスキップ。ソースニュースファイルが存在しなければ `SOURCE_MISSING`。
- **状態管理・冪等性**: `DAILY_STATE_DIR/<実行日>.json` に進捗を記録し、成功済み工程の二重実行を防止する。
- **事前チェック**:
  - 音声チェック: `DAILY_AUDIO_DIR/<実行日>/study.m4a|.mp3` または `news.m4a|.mp3`。無ければ `WAITING_AUDIO` として正常扱いし後段を待機。
  - 認証チェック: Spotify / note の AuthManager 状態確認。無効なら `AUTH_EXPIRED` として該当系統を停止。
- **CLI 実行**:
  - `spotify-automation` パッケージ内の既存 `src/cli.ts` (Spotify upload) と `src/noteCli.ts` (note draft/publish) を子プロセスとして呼び出す。CLI 自体は変更しない。
- **レポート生成**:
  - `daily-publish-report.json` に実行結果、成果物 URL、SSOT 進捗の算出値を書き出す。
- **終了コード**: 失敗 (`FAILED`, `SOURCE_MISSING`, `AUTH_EXPIRED`) がある場合は `1`、それ以外は `0`。
