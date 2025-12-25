# Requirements - Issue 115: 開発環境コンテナにおけるPlaywright実行環境とNx設定の整備

## ユーザーストーリー
開発者として、DevContainerを起動した直後から、追加の手動設定なしでPlaywrightのE2Eテストや監査スクリプトを実行できるようにしたい。また、コンテナを再起動してもGitHub CLIの認証状態が維持されるようにしたい。

## 受け入れ基準

### 1. Playwright実行環境の自動セットアップ
- [ ] DevContainerのビルドまたは起動時に、Playwrightブラウザ（および必要なシステム依存関係）が自動的にインストールされる。
- [ ] コンテナ内で `npx playwright test` がエラーなく実行できる。

### 2. Nxターゲットの追加
- [ ] `apps/ui-automations/spotify-automation/project.json` に `e2e` ターゲットが定義されている。
- [ ] `nx e2e spotify-automation` コマンドでE2Eテストが実行できる。

### 3. 監査スクリプトの実行環境整備
- [ ] `scripts/collect-audit-context.ts` が正常に実行できる（`tsx` または `ts-node` の適切な設定）。

### 4. GitHub CLI認証の永続化
- [ ] コンテナを再起動した後も、`gh auth status` で認証状態が維持されていることが確認できる。
- [ ] または、ホスト側の認証情報が透過的にコンテナ内で利用できる。
