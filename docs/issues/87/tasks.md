# 作業タスクリスト (tasks.md)

## 1. 脆弱性分析と対応

- [ ] `pnpm audit` を実行して、現在の脆弱性リストを詳細に確認する。
- [ ] `pnpm up --latest` を実行し、依存関係を可能な限り最新バージョンに更新する。
- [ ] 再度 `pnpm audit` を実行し、更新後に残存している脆弱性を特定する。
- [ ] トップレベルの依存関係で解決できない脆弱性について、`pnpm.overrides` を使用した修正を検討・適用する。

## 2. 動作検証

- [ ] `pnpm audit` を実行し、深刻度 `high` および `moderate` の脆弱性がすべて解消されたことを確認する。
- [ ] `pnpm test` を実行し、すべてのテストがパスすることを確認する。
- [ ] `spotify-automation` プロジェクトの主要スクリプト (`upload`, `test:cli`) を手動で実行し、デグレードが発生していないことを確認する。

## 3. プルリクエストとマージ

- [ ] `git add .` と `git commit` を使用して、変更内容をコミットする。（コミットメッセージは `fix(deps): address security vulnerabilities` などを参照）
- [ ] `git push` を行い、`feat/87-security-address-3-vulnerabilities-found-by-dependabot-2-high-1-low` ブランチをリモートにプッシュする。
- [ ] GitHub上でプルリクエストを作成し、Issue #87を紐付ける。
- [ ] CIのチェックがすべてパスすることを確認し、レビュー依頼を行う。
