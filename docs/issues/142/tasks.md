# 作業タスクリスト (tasks.md) - Issue #142

- [ ] **準備**
    - [ ] 既存のE2Eテストを実行し、現在の動作（特にエラーメッセージ）を記録する
- [ ] **実装: CLI リファクタリング**
    - [ ] `src/cli.ts` の `yargs` 定義を `option()` を使った形式に書き換える
    - [ ] 各オプションの `alias`, `type`, `description`, `demandOption` を設定する
    - [ ] `--config` の読み込みとマージロジックを整理する
    - [ ] `main` 関数内の不要になった手動バリデーションを削除する
    - [ ] 引数解析結果の型を整理し、`runSpotifyUpload` への受け渡しを最適化する
- [ ] **検証**
    - [ ] `pnpm --filter @my-apps/spotify-automation exec ts-node src/cli.ts --help` を実行し、ヘルプ画面を確認する
    - [ ] 既存のE2Eテストを実行し、すべてパスすることを確認する
    - [ ] Lintとビルド（型チェック）を実行する
