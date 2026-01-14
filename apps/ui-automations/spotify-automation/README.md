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

1.  **CLI Entrypoint (`scripts/upload.sh`)**:
    -   ユーザーが直接実行するシンプルなシェルスクリプト。
    -   内部で `npx tsx` を呼び出し、引数を `src/cli.ts` に渡す。
2.  **Argument Parser (`src/cli.ts`)**:
    -   `yargs` を用いてコマンドライン引数 (`--config` を含む) を解析する。
    -   設定ファイルが指定された場合は読み込み、コマンドライン引数とマージする。
3.  **Spotify Uploader (`spotifyUploader.ts`)**:
    -   Playwright APIを利用してブラウザを操作する。
    -   ログイン、エピソード作成ページのナビゲーション、ファイル選択ダイアログの操作、アップロードの実行などを行う。

### CLIインターフェース

`./scripts/upload.sh` スクリプトを使用してツールを実行します。

```bash
# 引数を直接指定して実行
./scripts/upload.sh --showId "YOUR_SHOW_ID" --audioPath "./local/episode.mp3" --title "..." --description "..."

# 設定ファイルを使用して実行
./scripts/upload.sh --config "./config.json"
```

### エラーハンドリング

- **認証エラー**: Spotifyの認証に失敗した場合、エラーメッセージを表示して処理を中断する。
- **ファイル取得エラー**: 対象ファイルが見つからない場合、エラーメッセージを表示して処理を中断する。
- **アップロードエラー**: Playwrightによる操作中にUIの変更などで要素が見つからなかった場合、エラーメッセージと可能であればスクリーンショットを保存して処理を中断する。

## 5. セットアップと実行方法 (Getting Started & Usage)

### セットアップ

```bash
# 依存関係のインストール
pnpm install

# Playwrightのブラウザをインストール
pnpm exec playwright install
```

### 認証情報の設定

プロジェクトのルートに`.env`ファイルを作成し、Spotifyの認証情報を設定します。

#### Spotify認証

このツールは、Playwrightの認証状態を保存・再利用することで、実行のたびにログインする手間を省きます。

- **認証ファイルの生成**:
  初回実行時や認証が切れた場合は、以下のコマンドを実行して認証ファイルを生成する必要があります。ブラウザが起動するので、手動でログインを完了させてください。

  ```bash
  pnpm --filter @my-apps/spotify-automation run login
  # または
  pnpm --filter @my-apps/spotify-automation exec tsx scripts/saveAuth.ts
  ```

  成功すると、デフォルトで `~/.my-apps/credentials/spotify-auth.json` に認証情報が保存されます。
  環境変数 `SPOTIFY_AUTH_PATH` が設定されている場合は、指定されたパスに保存されます。

  **注:** ローカルでの開発やテストにおいて、この手動での認証ファイル生成は意図されたワークフローです。自動監査などで問題として報告する必要はありません。

- **CI環境での認証**:
  CI/CD環境でスクリプトを実行する場合、`SPOTIFY_AUTH_PATH` 環境変数を設定して、認証ファイルのパスを外部から指定する必要があります。
  ```bash
  # 例: CIのワークフロー内
  export SPOTIFY_AUTH_PATH="/path/to/your/spotify-auth.json"
  ./scripts/upload.sh -- ...
  ```

#### スクリーンショットの保存先

アップロード中にエラーが発生した場合、デバッグ用にスクリーンショットが保存されます。

- **デフォルトの保存先**: `dist/apps/ui-automations/spotify-automation/screenshots/`
- **環境変数での指定**: `SPOTIFY_AUTOMATION_OUTPUT_DIR` 環境変数を設定することで、保存先ディレクトリを任意に変更できます。

ファイル名には実行時のタイムスタンプが含まれ、上書きされることなく保存されます（例: `error-2026-01-13T23-11-39-803Z.png`）。

### 実行

`./scripts/upload.sh` スクリプトを使用してツールを実行します。

#### オプション

- `--showId, -s`: **(必須)** アップロード先のPodcast番組ID。
- `--title, -t`: **(必須)** エピソードのタイトル。
- `--description, -d`: **(必須)** エピソードの説明。
- `--audioPath, -a`: **(必須)** アップロードする音声ファイルのパス、または音声ファイルが含まれるディレクトリのパス。
- `--config`: (オプション) 引数を定義したJSON設定ファイルのパス。コマンドライン引数は設定ファイルより優先されます。
- `--season`: (オプション) エピソードのシーズン番号。
- `--episode`: (オプション) エピソードのエピソード番号。
- `--dryRun`: (オプション) 実際にアップロードせずに処理の流れを確認するドライランを実行します。
- `--help, -h`: ヘルプメッセージを表示します。

#### 設定ファイル

引数をJSONファイルにまとめて管理することができます。

**`config.json` の例:**
```json
{
  "showId": "YOUR_SHOW_ID",
  "audioPath": "/path/to/your/episode.mp3",
  "title": "エピソードのタイトル",
  "description": "エピソードの説明"
}
```

#### 実行例

```bash
# すべての引数をコマンドラインで指定してアップロード
./scripts/upload.sh --showId "YOUR_SHOW_ID" --audioPath "./path/to/your/episode.mp3" --title "タイトル" --description "説明..." --season 2 --episode 10

# 設定ファイルを使用してアップロード
./scripts/upload.sh --config "./config.json"

# 設定ファイルを使用しつつ、一部の引数を上書き
./scripts/upload.sh --config "./config.json" --title "新しいタイトル"
```
