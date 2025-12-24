# Design - Issue 115: 開発環境コンテナにおけるPlaywright実行環境とNx設定の整備

## アーキテクチャと実装方針

### 1. Playwrightブラウザのセットアップ
- `.devcontainer/devcontainer.json` の `postCreateCommand` または `postStartCommand` に `pnpm install && npx playwright install --with-deps` を追加する。
- すでに `Dockerfile` が存在する場合は、システム依存関係のインストールを `Dockerfile` に含めることを検討する。

### 2. Nxターゲット (e2e) の追加
- `apps/ui-automations/spotify-automation/project.json` に以下のターゲットを追加する。
  ```json
  "e2e": {
    "executor": "@nx/playwright:playwright",
    "options": {
      "config": "apps/ui-automations/spotify-automation/playwright.config.ts"
    }
  }
  ```
- 必要に応じて `playwright.config.ts` のパスや設定を調整する。

### 3. スクリプト実行環境の改善
- `scripts/collect-audit-context.ts` の実行に `tsx` を使用するように `package.json` のスクリプトまたは実行方法を変更する。
- 依存関係に `tsx` が含まれていない場合は追加する。

### 4. GitHub CLI 認証の永続化
- `.devcontainer/devcontainer.json` の `mounts` 設定を使用して、ホスト側の `.config/gh` フォルダをコンテナにマウントする。
  - 例: `"source=${localEnv:HOME}/.config/gh,target=/home/devuser/.config/gh,type=bind"`
- または、DevContainerの公式 `github-cli` feature が提供する認証情報共有機能を利用する。

## データモデル / インターフェース
- 既存の `project.json` のスキーマに従う。
- `.devcontainer` 設定は VS Code DevContainer 仕様に従う。

## エラーハンドリング
- コンテナ起動時のスクリプト失敗を検知できるよう、`postCreateCommand` には適切なログ出力を含める。
- Playwrightのインストール失敗時は、再実行可能な手順を `README.md` 等に記載する。

## テスト戦略
- **コンテナ起動テスト**: 新しくビルドしたコンテナで `gh auth status` と `npx playwright --version` が成功することを確認。
- **Nxコマンドテスト**: `nx e2e spotify-automation` が実際にテストを実行できることを確認（ヘッドレスモード）。
- **スクリプトテスト**: `npx tsx scripts/collect-audit-context.ts` がエラーなく終了することを確認。
