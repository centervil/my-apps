# Requirements - Issue 132

## User Stories

- **As a** ポッドキャスト配信者 (Podcast Creator),
- **I want to** CLIのヘルプやREADMEを参照して、正しい引数やエイリアスを使用してエピソードをアップロードしたい,
- **So that** 迷うことなく迅速に最新のエピソードをSpotifyに公開できる。

## Acceptance Criteria

- [ ] `src/cli.ts` において、`yargs` を使用して以下のオプションが明示的に定義されていること。
  - `--showId` (alias: `-s`)
  - `--audioPath` (alias: `-a`)
  - `--title` (alias: `-t`)
  - `--description` (alias: `-d`)
  - `--season`
  - `--episode`
  - `--config` (alias: `-c`)
  - `--dryRun`
- [ ] `--help` コマンドを実行した際に、上記すべてのオプションの説明とエイリアスが表示されること。
- [ ] 必須引数（`showId`, `audioPath`, `title`, `description`）が指定されていない場合、`yargs` の機能によって適切なエラーメッセージが表示されること。
- [ ] `README.md` の実行例が、`ts-node` ではなく `tsx` または `pnpm` を使用した最新の構成に更新されていること。
- [ ] `scripts/upload.sh` が `tsx` を使用して `src/cli.ts` を正しく呼び出していること。
- [ ] `package.json` の `upload` スクリプトが最新の CLI 構成と整合していること。
