# タスクリスト (tasks.md)

## 1. 準備
- [ ] `pnpm add -D yargs @types/yargs --filter spotify-automation` を実行し、依存関係を追加する。

## 2. CLIエントリーポイント作成
- [ ] `apps/ui-automations/spotify-automation/scripts/` ディレクトリを作成する。
- [ ] `apps/ui-automations/spotify-automation/scripts/upload.ts` ファイルを新規作成する。

## 3. CLIロジック実装 (`scripts/upload.ts`)
- [ ] `yargs` をインポートし、CLIのセットアップを行う。
- [ ] `--showId` (必須) と `--audioPath` (オプション) の引数を定義する。
- [ ] `audioPath` が指定されなかった場合のフォールバックロジックを実装する。
  - [ ] `tmp/downloads` ディレクトリを読み込む。
  - [ ] 最新のファイルを取得する処理を実装する。
  - [ ] ファイルが見つからない場合のエラーハンドリングを実装する。
- [ ] `try...catch` ブロックでメイン処理を囲み、エラーハンドリングを実装する。
- [ ] 既存のアップロードロジック `spotifyUploader` をインポートし、決定した `showId` と `audioPath` を渡して呼び出す。

## 4. `package.json` の更新
- [ ] `apps/ui-automations/spotify-automation/package.json` を開く。
- [ ] `scripts` セクションに `"upload": "ts-node -r tsconfig-paths/register ./apps/ui-automations/spotify-automation/scripts/upload.ts"` を追加する。

## 5. テスト (任意だが推奨)
- [ ] CLIの引数解析に関する単体テストを作成する。
- [ ] ファイルフォールバック機能に関する単体テストを作成する。

## 6. ドキュメント
- [ ] `apps/ui-automations/spotify-automation/README.md` を更新し、新しいCLIの使用方法について記載する。
