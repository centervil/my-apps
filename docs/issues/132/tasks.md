# Tasks - Issue 132

## Implementation

- [ ] `apps/ui-automations/spotify-automation/src/cli.ts` の修正
  - [ ] `yargs` オプションの詳細定義（`showId`, `audioPath`, `title`, `description`, `season`, `episode`, `dryRun`, `config`）
  - [ ] 必須項目のチェック（`.demandOption()`）
  - [ ] エイリアスの追加（`alias`）
- [ ] `apps/ui-automations/spotify-automation/scripts/upload.sh` の修正
  - [ ] `npx tsx` を使用するように更新
- [ ] `apps/ui-automations/spotify-automation/package.json` の修正
  - [ ] `upload` スクリプトの確認と更新
- [ ] `apps/ui-automations/spotify-automation/README.md` の更新
  - [ ] 実行例の `ts-node` を `tsx` または `pnpm` に変更
  - [ ] オプション説明を最新化

## Verification

- [ ] `npx nx e2e spotify-automation` の実行
- [ ] `scripts/upload.sh --help` の手動確認
- [ ] 実際に `--dryRun` を使用した動作確認
