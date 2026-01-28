# タスクリスト - Issue 171

## 準備
- [x] 既存の全コマンドファイル（`.gemini/commands/*.toml`）の内容をバックアップ・調査する。 <!-- id: 0 -->

## 実装
- [x] `.gemini/commands/dev.toml` を作成し、統合ロジックを実装する。 <!-- id: 1 -->
    - [x] 引数解析ロジック（Issue番号とサブコマンドの抽出）の実装。
    - [x] 全工程自動実行モードのプロンプト構成。
    - [x] 個別機能実行モード（start, task, review, end, cancel）のプロンプト構成。
- [x] `/dev` コマンドが正しく動作することを検証する。 <!-- id: 2 -->

## クリーンアップ
- [x] 以下の個別コマンドファイルを削除する。 <!-- id: 3 -->
    - [x] `.gemini/commands/dev-start.toml`
    - [x] `.gemini/commands/task-start.toml`
    - [x] `.gemini/commands/review.toml`
    - [x] `.gemini/commands/dev-end.toml`
    - [x] `.gemini/commands/dev-cancel.toml`
- [x] 削除後、再度 `/dev` コマンドが正常に動作することを確認する。 <!-- id: 4 -->

## 完了報告
- [x] 開発ログ（`development_logs/`）を更新し、変更内容を記録する。 <!-- id: 5 -->
