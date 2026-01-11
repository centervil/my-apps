# 要件定義書 (requirements.md) - Issue #142

## 概要
Spotify Automation CLI の引数解析ロジックをリファクタリングし、`yargs` の機能を最大限に活用することで、ツールの堅牢性とユーザビリティを向上させる。

## ユーザーストーリー
**As a** ポッドキャスト配信者,
**I want to** コマンドの使い方が分かりやすく、不正な引数に対して適切なエラーが表示されること,
**So that** 迷わずにアップロード作業を完了させたい。

## 受け入れ基準 (Acceptance Criteria)
- [ ] `src/cli.ts` ですべての引数（`--showId`, `--audioPath`, `--title`, `--description`, `--season`, `--episode`, `--dryRun`, `--config`）が `yargs.option()` で明示的に定義されていること。
- [ ] 必須引数（`showId`, `audioPath`, `title`, `description`）が指定されていない場合、`yargs` によって標準的なエラーメッセージが表示され、プロセスが異常終了すること。
- [ ] `--help` コマンドを実行した際に、各引数の説明（description）と型（type）が正しく表示されること。
- [ ] `main` 関数内で行っていた手動の引数チェックロジックが削除され、コードが簡素化されていること。
- [ ] 既存のE2Eテスト（`cli.spec.ts`）がすべてパスし、挙動にデグレードがないこと。
