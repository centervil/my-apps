# 設計書 (design.md)

## 1. 概要

本設計書は、Issue #110 で定義された「Spotifyアップロードワークフローの外部パラメータ駆動型への改修」を実現するための技術的な設計を記述する。

## 2. アーキテクチャ

改修後のワークフロー (`.github/workflows/spotify-upload.yml`) は、以下のステップで構成される。

1.  **設定定義 (Environment Variables)**:
    *   `job` レベルの `env` ブロックで、外部設定ファイルが格納されているリポジトリのURL (`CONFIG_REPO_URL`) と、そのリポジトリ内の設定ファイルのパス (`CONFIG_FILE_PATH`) を定義する。これにより、番組ごとの複製が容易になる。

2.  **リポジトリのチェックアウト (Checkout Main Repo)**:
    *   `actions/checkout@v4` を使用して、ワークフローが実行されているメインリポジトリのコンテンツをチェックアウトする。

3.  **設定リポジトリのチェックアウト (Checkout Config Repo)**:
    *   `actions/checkout@v4` を再度使用し、`CONFIG_REPO_URL` で指定された外部リポジトリを、別ディレクトリ（例: `config`）にチェックアウトする。

4.  **パラメータの抽出と設定 (Parse Config & Set ENV)**:
    *   チェックアウトした設定ファイル (`config/${CONFIG_FILE_PATH}`) の内容を読み込む。
    *   設定ファイルの形式は `JSON` とする。`jq` などのツールを使用して、ファイルからエピソードのタイトル、説明、オーディオファイルパス、ショーIDを抽出する。
    *   抽出した値を `>> $GITHUB_ENV` を使って、後続のステップで利用可能な環境変数 (`EPISODE_TITLE`, `EPISODE_DESCRIPTION`, `AUDIO_FILE_PATH`, `SHOW_ID`) として設定する。

5.  **pnpm のセットアップ (Setup pnpm)**:
    *   `pnpm/action-setup` を使用して `pnpm` をセットアップする。

6.  **Node.js のセットアップ (Setup Node.js)**:
    *   `actions/setup-node@v4` を使用して、CLIツールの実行に必要なNode.js環境をセットアップする。

7.  **依存関係のインストール (Install Dependencies)**:
    *   `pnpm install` を実行して、プロジェクトの依存関係をインストールする。

8.  **エピソードのアップロード (Upload Episode)**:
    *   `upload.sh` スクリプトを実行する。この際、ステップ4で設定した環境変数を引数としてスクリプトに渡す。
    *   `bash apps/ui-automations/spotify-automation/scripts/upload.sh "$EPISODE_TITLE" "$EPISODE_DESCRIPTION" "$AUDIO_FILE_PATH" "$SHOW_ID"` のように実行する。

## 3. 実装方針

### 3.1. ワークフローファイルの修正 (`.github/workflows/spotify-upload.yml`)

-   **`env` ブロックの追加**:
    *   `jobs.upload.env` に `CONFIG_REPO_URL` と `CONFIG_FILE_PATH` を追加し、複製時の変更箇所としてコメントを追記する。
-   **認証情報の削除**:
    *   `env` ブロックから `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN` を削除する。
-   **ステップの追加・修正**:
    *   `actions/checkout` を使用して設定リポジトリをチェックアウトするステップを追加する。`path` を指定して、メインリポジトリと衝突しないようにする。
    *   `jq` を使用してJSONファイルをパースし、環境変数を設定する `run` ステップを追加する。
    *   `upload.sh` を呼び出す `run` ステップを修正し、環境変数を引数として渡すように変更する。

### 3.2. 設定ファイルの形式

-   設定ファイルはJSON形式 (`config.json`) とする。
-   例:
    ```json
    {
      "episodeTitle": "My Awesome Episode",
      "episodeDescription": "A detailed description of the episode.",
      "audioFilePath": "path/to/audio.mp3",
      "showId": "YOUR_SHOW_ID"
    }
    ```

### 3.3. `upload.sh` スクリプトの修正

-   現在の `upload.sh` が固定の引数や環境変数に依存している場合、引数から動的に値を受け取れるように修正が必要か確認する。
-   設計上、`upload.sh` は引数をそのまま `pnpm exec` コマンドに渡す想定のため、大きな変更は不要と見込まれる。

## 4. テスト戦略

-   **単体テスト**:
    *   本改修は主にGitHub Actionsワークフローの修正であり、単体テストの対象となる新しいコードは限定的。
-   **インテグレーションテスト**:
    *   実際にテスト用の公開リポジトリと設定ファイルを作成する。
    *   改修したワークフローを `workflow_dispatch` を使って手動でトリガーし、以下の点を確認する。
        1.  設定リポジトリが正しくチェックアウトされること。
        2.  設定ファイルが正しくパースされ、環境変数が設定されること。
        3.  `upload.sh` スクリプトが正しい引数で実行されること。
        4.  （可能であれば）Spotifyへのアップロードが成功すること（これは実際の認証情報が必要なため、シークレットを設定したテスト環境で実施）。
-   **手動テスト**:
    *   ワークフローファイルをコピーし、`env` の値を変更するだけで別の番組として機能するかどうかを確認する。