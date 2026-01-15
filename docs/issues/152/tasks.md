# Tasks: CIワークフロー修正

## タスクリスト

- [x] `package.json` を確認し、推奨される pnpm バージョンを特定する <!-- id: 1 -->
- [x] `.github/workflows/ci.yml` の `pnpm/action-setup` のバージョン指定を修正する <!-- id: 2 -->
- [x] `.github/workflows/ci.yml` の `if` 条件式の `${{ }}` を削除する <!-- id: 3 -->
- [x] 変更をコミットし、リモートブランチにプッシュする <!-- id: 4 -->
- [x] GitHub Actions の実行状況を確認し、エラーが解消されたことを検証する <!-- id: 5 -->