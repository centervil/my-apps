# Spotify Automation CLI

## 1. 概要 (Overview)

このプロジェクトは、Spotify for Creators (旧 Spotify for Podcasters) へのポッドキャストエピソードのアップロード作業を自動化するためのコマンドラインインターフェース（CLI）ツールです。

手動で行っていたブラウザ操作をPlaywrightによって自動化し、単一のコマンドを実行するだけで、指定した音声ファイルを指定したPodcast番組にアップロードすることを目的とします。

## 2. ユースケース (Use Case)

ポッドキャスト配信者が、収録・編集済みの音声ファイルを、迅速かつミスなくSpotifyに公開したい、という状況を想定しています。

このツールを使うことで、配信者はSpotifyの管理画面を直接操作することなく、ターミナルからコマンド一つでアップロード作業を完了でき、コンテンツ制作に集中できます。

## 3. 主な要件 (Requirements)

このツールは、以下のユーザーストーリーを満たす必要があります。

- **As a** ポッドキャスト配信者,
- **I want to** コマンドラインから簡単なコマンドを実行するだけで、Google Drive上の最新の音声ファイルを自動でSpotifyにアップロードしたい,
- **So that** 迅速かつ効率的に新しいエピソードを公開できる。

### 受け入れ基準 (Acceptance Criteria)

- [ ] CLIはコマンドライン引数として以下を受け取ること。
  - `--showId <string>`: (必須) アップロード先のPodcast番組ID
  - `--audioPath <string>`: (必須) アップロードする音声ファイル、または音声ファイルが含まれるディレクトリのパス。
- [ ] `--audioPath` にファイルパスが指定された場合、そのファイルをアップロード対象とすること。
- [ ] `--audioPath` にディレクトリパスが指定された場合、そのディレクトリ内で最も新しく更新されたファイルをアップロード対象とすること。
- [ ] Spotifyにログインし、指定された番組のエピソードアップロード画面に遷移できること。
- [ ] 処理の成功または失敗が、標準出力で明確に報告されること。
- [ ] 不正なパスが指定された場合に、適切なエラーメッセージを出力すること。

## 4. 基本設計 (High-Level Design)

### アーキテクチャ

ツールの処理は、以下のコンポーネントが連携して実行されます。

1.  **CLI Entrypoint (`scripts/upload.ts`)**:
    - `yargs`を用いてコマンドライン引数を解析する。
    - `--audioPath`で指定されたパスを検証する。
      - パスがファイルであれば、それを対象とする。
      - パスがディレクトリであれば、その中で最新のファイルを検索する。
    - 各コンポーネントを呼び出し、処理フロー全体を制御する。

2.  **Spotify Uploader (`src/features/spotifyUploader.ts`)**:
    - Playwright APIを利用してブラウザを操作する。
    - ログイン、エピソード作成ページのナビゲーション、ファイル選択ダイアログの操作、アップロードの実行などを行う。

### CLIインターフェース

ツールの実行コマンドは以下のようになります。

```bash
# 特定のファイルを指定してアップロード
pnpm --filter @my-apps/spotify-automation upload -- --showId "YOUR_SHOW_ID" --audioPath "./local/episode.mp3" --title "..." --description "..."

# 特定のフォルダから最新のファイルを検索してアップロード
pnpm --filter @my-apps/spotify-automation upload -- --showId "YOUR_SHOW_ID" --audioPath "./local/episodes/" --title "..." --description "..."
```

### エラーハンドリング

- **認証エラー**: SpotifyまたはGoogle Driveの認証に失敗した場合、エラーメッセージを表示して処理を中断する。
- **ファイル取得エラー**: 対象ファイルが見つからない場合、エラーメッセージを表示して処理を中断する。
- **アップロードエラー**: Playwrightによる操作中にUIの変更などで要素が見つからなかった場合、エラーメッセージと可能であればスクリーンショットを保存して処理を中断する。

## 5. セットアップと実行方法 (Getting Started & Usage)

### セットアップ

```bash
# 依存関係のインストール
pnpm install
```

### 認証情報の設定

プロジェクトのルートに`.env`ファイルを作成し、Spotifyの認証情報を設定します。

#### Spotify認証

このツールは、Playwrightの認証状態を保存・再利用することで、実行のたびにログインする手間を省きます。

- **認証ファイルの生成**:
  初回実行時や認証が切れた場合は、以下のコマンドを実行して認証ファイルを生成する必要があります。ブラウザが起動するので、手動でログインを完了させてください。

  ```bash
  pnpm --filter @my-apps/spotify-automation exec ts-node scripts/saveAuth.ts
  ```

  成功すると、`.auth/spotify-auth.json` に認証情報が保存されます。

  **注:** ローカルでの開発やテストにおいて、この手動での認証ファイル生成は意図されたワークフローです。自動監査などで問題として報告する必要はありません。

- **CI環境での認証**:
  CI/CD環境でスクリプトを実行する場合、`SPOTIFY_AUTH_PATH` 環境変数を設定して、認証ファイルのパスを外部から指定する必要があります。
  ```bash
  # 例: CIのワークフロー内
  export SPOTIFY_AUTH_PATH=\"/path/to/your/spotify-auth.json\"
  pnpm --filter @my-apps/spotify-automation upload -- ...
  ```

### 実行

`pnpm --filter @my-apps/spotify-automation upload -- <args>` 形式でコマンドを実行します。

**オプション:**

- `--showId, -s`: **(必須)** アップロード先のPodcast番組ID。
- `--title, -t`: **(必須)** エピソードのタイトル。
- `--description, -d`: **(必須)** エピソードの説明。
- `--audioPath, -a`: **(必須)** アップロードする音声ファイルのパス、または音声ファイルが含まれるディレクトリのパス。
- `--dryRun`: (オプション) 実際にアップロードせずに処理の流れを確認するドライランを実行します。
- `--help, -h`: ヘルプメッセージを表示します。

**例:**

```bash
# 特定の音声ファイルを指定してアップロード
pnpm --filter @my-apps/spotify-automation upload -- --showId "YOUR_SHOW_ID" --audioPath "./path/to/your/episode.mp3" --title "エピソードのタイトル" --description "エピソードの説明文..."

# 特定のディレクトリから最新のファイルを検索してアップロード
pnpm --filter @my-apps/spotify-automation upload -- --showId "YOUR_SHOW_ID" --audioPath "./path/to/your/episodes_folder/" --title "エピソードのタイトル" --description "エピソードの説明文..."
```
