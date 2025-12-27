# Tasks - Issue 129

## 準備
- [ ] 既存の `tests/e2e/cli.spec.ts` と `scripts/test-cli.ts` の内容を再確認する。

## テストの移植と統合
- [ ] `tests/e2e/cli.spec.ts` にテストアセット（一時ディレクトリ・ファイル）の生成ロジックを追加する。
- [ ] `scripts/test-cli.ts` から以下のテストケースを `tests/e2e/cli.spec.ts` に移植する：
    - [ ] `audioPath` 欠落のバリデーションテスト。
    - [ ] 存在しないパスのバリデーションテスト。
    - [ ] 空ディレクトリのバリデーションテスト。
    - [ ] 特定ファイル指定時の正常系テスト（ドライラン）。
    - [ ] ディレクトリ指定時の最新ファイル検索テスト（ドライラン）。
- [ ] 移植したテストが `npx playwright test tests/e2e/cli.spec.ts` で通過することを確認する。

## クリーンアップ
- [ ] `apps/ui-automations/spotify-automation/scripts/test-cli.ts` を削除する。
- [ ] `apps/ui-automations/spotify-automation/package.json` から `"test:cli"` スクリプトを削除する。

## 最終確認
- [ ] `npx nx e2e spotify-automation` を実行し、すべてのテストが正常に完了することを確認する。
- [ ] 不要な一時ファイルが残っていないことを確認する。
