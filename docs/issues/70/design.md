# 設計書 (design.md)

## 1. 概要
`spotify-automation` プロジェクトに、コマンドライン引数を受け取ってエピソードアップロード処理を実行するCLI機能を実装するための技術設計。

## 2. アーキテクチャ
- **CLIエントリーポイント**: `apps/ui-automations/spotify-automation/scripts/upload.ts` を新規に作成し、CLIの実行起点とする。
- **引数解析ライブラリ**: `yargs` を導入する。堅牢な引数解析、型定義のサポート（`@types/yargs`）、ヘルプメッセージの自動生成機能が充実しているため。
- **モジュール構成**:
  - `scripts/upload.ts`: CLIのメインロジック。`yargs` を用いて引数を解析し、`src/features/spotifyUploader.ts` を呼び出す責務を持つ。
  - `src/features/spotifyUploader.ts`: (既存) Playwrightを利用した実際のアップロード処理。CLIから渡されたパラメータを受け取るように適宜リファクタリングする可能性がある。
  - `package.json`: `yargs` と `@types/yargs` を `devDependencies` に追加し、`"upload": "ts-node -r tsconfig-paths/register ./apps/ui-automations/spotify-automation/scripts/upload.ts"` のような実行スクリプトを定義する。`ts-node` と `tsconfig-paths/register` を利用して、TypeScriptのまま実行し、エイリアスパス（`@/`など）を解決する。

## 3. 実装方針

### 3.1. CLI引数の定義 (`scripts/upload.ts`)
`yargs` を使用して、以下のコマンドライン引数を定義する。

- `showId`:
  - `alias`: `s`
  - `type`: `string`
  - `description`: 'アップロード先のPodcast番組ID'
  - `demandOption`: `true` (必須)
- `audioPath`:
  - `alias`: `a`
  - `type`: `string`
  - `description`: 'アップロードする音声ファイルのローカルパス'
  - `demandOption`: `false` (オプション)

### 3.2. 音声ファイルのフォールバック処理 (`scripts/upload.ts`)
1.  `audioPath` 引数が指定されているか確認する。
2.  指定されていない場合、`tmp/downloads` ディレクトリ内のファイル一覧を取得する (`fs.readdirSync`)。
3.  取得したファイルリストを更新日時でソートし、最新のファイルを選択する。
4.  適切な音声ファイルが見つからない場合（ディレクトリが存在しない、ファイルがない等）、エラーをスローして処理を中断する。

### 3.3. アップロードロジックの呼び出し (`scripts/upload.ts`)
1.  上記で確定した `showId` と `audioPath` を引数として、`spotifyUploader` 関数を呼び出す。
2.  `spotifyUploader` は `Promise` を返すように設計し、`await` で完了を待つ。
3.  アップロード処理中に発生したエラーは `try...catch` で捕捉し、コンソールにエラーメッセージを出力して `process.exit(1)` で終了する。

### 3.4. `package.json` の設定
- `devDependencies` に `yargs` と `@types/yargs` を追加する。
- `scripts` に `"upload": "ts-node -r tsconfig-paths/register ./apps/ui-automations/spotify-automation/scripts/upload.ts"` を追加する。

## 4. テスト戦略
- **単体テスト**:
  - CLIの引数解析ロジックをテストする。必須引数がない場合にエラーとなること、オプション引数が正しく解釈されることを確認する。
  - 音声ファイルのフォールバック処理をテストする。模擬的なファイルシステム (`mock-fs`など) を利用して、最新のファイルが正しく選択されること、ファイルが見つからない場合にエラーとなることを確認する。
- **統合テスト**:
  - CLIスクリプトを実行し、`spotifyUploader` 関数が期待される引数で呼び出されることをスパイ（`sinon`など）を用いて検証する。実際のアップロード処理（Playwrightの起動）はモック化する。
- **E2Eテスト**:
  - `npm run upload` コマンドを実際に実行し、一連の処理が正常に完了することを（可能であれば）確認する。ただし、これはCI環境での実行が難しい場合があるため、手動テストで代替することも検討する。

## 5. エラーハンドリング
- 引数が不正な場合: `yargs` の機能を利用して、分かりやすいエラーメッセージとヘルプを表示する。
- ファイルが見つからない場合: 具体的なエラーメッセージ（例: `Error: Audio file not found in tmp/downloads. Please specify with --audioPath.`）を表示し、`process.exit(1)` で終了する。
- アップロード処理中のエラー: `spotifyUploader` からスローされたエラーを捕捉し、スタックトレースを含む詳細なエラー情報をコンソールに出力する。
