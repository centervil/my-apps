# 作業タスクリスト (tasks.md)

## 概要

Issue #94「refactor(spotify-automation): Improve CI-friendliness of upload script」を完了するための具体的な作業タスクを以下に示します。

## タスクリスト

### 1. 実装

- [ ] `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` を開く。
- [ ] `playwright.chromium.launch` の引数 `headless` を `false` から `true` に変更する。
- [ ] 認証ファイルのパスを解決するロジックをリファクタリングする。
  - [ ] 環境変数 `SPOTIFY_AUTH_PATH` からパスを取得する処理を追加する。
  - [ ] 環境変数が存在しない場合に、既存のデフォルトパスへフォールバックする処理を実装する。

### 2. テスト

- [ ] ローカル環境でスクリプトを実行し、変更後も正常に動作することを確認する。
- [ ] (任意) `getAuthPath` 関数のための単体テストを作成する。

### 3. CI/CD設定

- [ ] 関連するGitHub Actionsのワークフローファイル (`.github/workflows/ci.yml` 等) を特定し、`SPOTIFY_AUTH_PATH` 環境変数を設定するステップを追加する。
    - `secrets` を利用して安全にパスを渡すことを検討する。

### 4. ドキュメントとレビュー

- [ ] `README.md` や関連ドキュメントに、新しい環境変数 `SPOTIFY_AUTH_PATH` に関する説明を追記する。
- [ ] プルリクエストを作成し、変更内容についてレビューを依頼する。
- [ ] CI/CDパイプラインが正常に完了することを確認する。
