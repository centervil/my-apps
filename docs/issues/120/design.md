# Design: Playwright Browser Installation Setup

## 1. アーキテクチャ (Architecture)
本件はコードロジックの変更ではなく、環境構築およびCIパイプラインの設定変更である。
既存のプロジェクト構造やアーキテクチャへの影響はない。

## 2. コンポーネント設計 (Component Design)

### 2.1. ドキュメンテーション (README)
- **対象ファイル**: `apps/ui-automations/spotify-automation/README.md`
- **変更内容**: 「セットアップ」セクションに、依存関係インストール (`pnpm install`) の直後にブラウザバイナリのインストールコマンドを追記する。

### 2.2. CI/CD パイプライン
- **対象ファイル**: `.github/workflows/ci.yml`
- **変更内容**: `test` ジョブ（またはPlaywrightテストを実行するジョブ）において、`pnpm install` ステップの後、かつ `playwright test` 実行の前に、以下のステップを追加する。
  ```yaml
  - name: Install Playwright Browsers
    run: pnpm exec playwright install --with-deps
    # --with-deps はCI環境（Ubuntuなど）でシステム依存パッケージもインストールするために推奨されるが、
    # GitHub Runnersは通常これらがプリインストールされている場合もある。
    # 安全のため `npx playwright install --with-deps` または単に `install` を使用する。
    # プロジェクトのルートで実行するか、フィルタリングして実行するかはCIの構成に依存するが、
    # Playwrightはグローバルキャッシュを使うため、ルートでの実行で問題ない場合が多い。
  ```
- **考慮事項**:
  - キャッシュ: Playwrightのバイナリは大きいため、必要に応じてキャッシュ戦略を検討するが、今回は必須要件ではない（まずは動くようにする）。

## 3. テスト戦略 (Test Strategy)

### 3.1. 手動検証
- **ローカル**:
  1. `node_modules` と Playwrightのキャッシュをクリアした状態で再現確認（任意）。
  2. READMEの手順通りにコマンドを実行し、`pnpm exec playwright test` が動作することを確認する。

### 3.2. 自動テスト (CI)
- **CI**:
  - Pull Requestを作成し、GitHub Actionsがトリガーされることを確認。
  - `Install Playwright Browsers` ステップが成功し、後続のE2Eテストが "Executable doesn't exist" エラーで落ちないことを確認する。
