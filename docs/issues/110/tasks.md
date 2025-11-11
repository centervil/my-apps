# タスクリスト (tasks.md)

本タスクリストは、Issue #110 の設計書に基づき、具体的な実装タスクをチェックリスト形式で記述します。

## フェーズ1: ワークフローの改修

-   [ ] `.github/workflows/spotify-upload.yml` ファイルを開く。
-   [ ] `jobs.upload` レベルに `env` ブロックを定義する。
-   [ ] `env` ブロックに、設定リポジトリのURLを保持する `CONFIG_REPO_URL` を追加する。（値はプレースホルダーで可）
-   [ ] `env` ブロックに、設定ファイルのパスを保持する `CONFIG_FILE_PATH` を追加する。（値はプレースホルダーで可）
-   [ ] `env` ブロックに、複製時のガイドとなるコメントを追記する。
-   [ ] ワークフロー内の `env` ブロックから `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` の定義を削除する。
-   [ ] `actions/checkout` を使用して、`CONFIG_REPO_URL` で指定されたリポジトリを `config` ディレクトリにチェックアウトするステップを追加する。
-   [ ] `jq` と `>> $GITHUB_ENV` を使用して、`config/${CONFIG_FILE_PATH}` から以下の値を読み込み、環境変数として設定する `run` ステップを追加する。
    -   `EPISODE_TITLE`
    -   `EPISODE_DESCRIPTION`
    -   `AUDIO_FILE_PATH`
    -   `SHOW_ID`
-   [ ] `upload.sh` を実行するステップを修正し、上記で設定した環境変数を引数として渡すように変更する。
    -   例: `bash apps/ui-automations/spotify-automation/scripts/upload.sh "$EPISODE_TITLE" "$EPISODE_DESCRIPTION" "$AUDIO_FILE_PATH" "$SHOW_ID"`

## フェーズ2: テストと検証

-   [ ] テスト用の公開GitHubリポジトリを作成する。
-   [ ] 作成したリポジトリに、テスト用の `config.json` ファイルを配置する。
-   [ ] `spotify-upload.yml` の `CONFIG_REPO_URL` と `CONFIG_FILE_PATH` を、テスト用リポジトリとファイルに合わせて更新する。
-   [ ] 改修したワークフローを `workflow_dispatch` を使って実行し、各ステップが意図通りに動作することを確認する。
-   [ ] ワークフローの実行ログをレビューし、環境変数が正しく設定され、スクリプトに渡されていることを確認する。

## フェーズ3: ドキュメントとクリーンアップ

-   [ ] ワークフロー内のコメントが、他の開発者にとって分かりやすいか確認し、必要に応じて修正する。
-   [ ] `CONFIG_REPO_URL` と `CONFIG_FILE_PATH` の値を、実際の運用で使用するリポジトリのURL（またはテンプレートとしてのプレースホルダー）に戻す。
-   [ ] PRを作成し、変更内容をレビュー依頼する。