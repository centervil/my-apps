# Spotify Automation CLI

## 1. 概要 (Overview)

このプロジェクトは、Spotify for Creators (旧 Spotify for Podcasters) へのポッドキャストエピソードのアップロード作業を自動化するためのコマンドラインインターフェース（CLI）ツールです。

手動で行っていたブラウザ操作をPlaywrightによって自動化し、単一のコマンドを実行するだけで、指定した音声ファイルを指定したPodcast番組にアップロードすることを目的とします。

## 2. ユースケース (Use Case)

ポッドキャスト配信者が、収録・編集済みの音声ファイル（Google Drive上の特定フォルダに保管）を、迅速かつミスなくSpotifyに公開したい、という状況を想定しています。

このツールを使うことで、配信者はSpotifyの管理画面を直接操作することなく、ターミナルからコマンド一つでアップロード作業を完了でき、コンテンツ制作に集中できます。

## 3. 主な要件 (Requirements)

このツールは、以下のユーザーストーリーを満たす必要があります。

- **As a** ポッドキャスト配信者,
- **I want to** コマンドラインから簡単なコマンドを実行するだけで、Google Drive上の最新の音声ファイルを自動でSpotifyにアップロードしたい,
- **So that** 迅速かつ効率的に新しいエピソードを公開できる。

### 受け入れ基準 (Acceptance Criteria)

- [ ] CLIはコマンドライン引数として以下を受け取ること。
  - `--showId <string>`: (必須) アップロード先のPodcast番組ID
  - `--audioPath <string>`: (オプション) アップロードする音声ファイルのローカルパス。指定しない場合、ローカルの一時ダウンロードディレクトリから最新のファイルが自動的に選択される。
- [ ] `--audioPath`が指定されない場合、ローカルの一時ディレクトリにある最新の音声ファイルをアップロード対象とすること。
- [ ] 設定されたGoogle Driveフォルダから最新の音声ファイルをダウンロードできること。
- [ ] Spotifyにログインし、指定された番組のエピソードアップロード画面に遷移できること。
- [ ] 処理の成功または失敗が、標準出力で明確に報告されること。

## 4. 基本設計 (High-Level Design)

### アーキテクチャ

ツールの処理は、以下のコンポーネントが連携して実行されます。

1.  **CLI Entrypoint (`scripts/upload.ts`)**:
    - `yargs`等を用いてコマンドライン引数を解析する。
    - `--audioPath`引数の有無を確認し、ない場合はローカルの一時ディレクトリから最新ファイルを探す。
    - 各コンポーネントを呼び出し、処理フロー全体を制御する。

2.  **Google Drive Downloader (`src/libs/googleDrive.ts`)**:
    - `googleapis`ライブラリを使用する。
    - `.env`に設定された`GOOGLE_DRIVE_FOLDER_ID`を元にフォルダ内を検索し、最新の音声ファイルをローカルの一時ディレクトリにダウンロードする。

3.  **Spotify Uploader (`src/features/spotifyUploader.ts`)**:
    - Playwright APIを利用してブラウザを操作する。
    - ログイン、エピソード作成ページのナビゲーション、ファイル選択ダイアログの操作、アップロードの実行などを行う。

### CLIインターフェース

ツールの実行コマンドは以下のようになります。

```bash
# Google Drive上の最新ファイルを自動で検索・ダウンロードしてアップロード
npm run upload -- --showId "YOUR_SHOW_ID"

# ローカルの特定ファイルを指定してアップロード
npm run upload -- --showId "YOUR_SHOW_ID" --audioPath "./local/episode.mp3"
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

プロジェクトのルートに`.env`ファイルを作成し、以下の情報を設定します。

```
# Spotify
SPOTIFY_EMAIL=your_email@example.com
SPOTIFY_PASSWORD=your_password

# Google Drive API
GOOGLE_API_CREDENTIALS=...
GOOGLE_DRIVE_FOLDER_ID=your_folder_id_to_monitor
```

### 実行

```bash
# 最新エピソードを自動アップロード
npm run upload -- --showId "YOUR_SHOW_ID"
```