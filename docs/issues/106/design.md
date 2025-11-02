# 設計書 (design.md)

## 1. はじめに

本ドキュメントは、`spotify-automation`プロジェクトをNxワークスペースに統合するための技術的な設計を定義する。

## 2. アーキテクチャ

`spotify-automation`プロジェクトをNxの`project`として正式に登録する。これにより、Nxはプロジェクトのタスクや依存関係を認識できるようになる。

- **`project.json`の導入**: `apps/ui-automations/spotify-automation`ディレクトリに`project.json`ファイルを新規作成し、プロジェクトのメタデータとタスク（ターゲット）を定義する。
- **`package.json`の修正**: `project.json`で定義したタスクと重複するスクリプトを`package.json`から削除し、タスクランナーをNxに一元化する。
- **CI/CDの更新**: `.github/workflows/ci.yml`を更新し、`spotify-automation`プロジェクトのCIがNxの`affected`コマンドによってトリガーされるようにする。

## 3. 実装方針

### 3.1. `project.json`の作成

`apps/ui-automations/spotify-automation/project.json`を以下の内容で作成する。

```json
{
  "name": "spotify-automation",
  "$schema": "../../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/ui-automations/spotify-automation/src",
  "projectType": "application",
  "targets": {
    "test": {
      "executor": "@nx/playwright:playwright",
      "options": {
        "config": "apps/ui-automations/spotify-automation/playwright.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/linter:eslint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": [
          "apps/ui-automations/spotify-automation/**/*.ts"
        ]
      }
    }
  },
  "tags": ["scope:ui-automation", "type:app"]
}
```

*   `@nx/playwright:playwright`エクゼキュータを使用して`test`ターゲットを定義する。
*   `@nx/linter:eslint`エクゼキュータを使用して`lint`ターゲットを定義する。

### 3.2. `package.json`のクリーンアップ

`apps/ui-automations/spotify-automation/package.json`から、`"scripts"`フィールド内の`"test"`および`"lint"`に関連する記述を削除する。

### 3.3. CI/CDワークフローの確認

`.github/workflows/ci.yml`ファイルを確認し、`test`および`lint`ジョブが`nx affected --target=test --parallel=3`や`nx affected --target=lint --parallel=3`のようなコマンドを使用していることを確認する。`spotify-automation`プロジェクトがこれらの影響範囲に含まれることで、自動的にCIの対象となる。

## 4. テスト戦略

1.  **単体テスト**: `nx test spotify-automation`コマンドを実行し、Playwrightテストが正常に完了することを確認する。
2.  **リンティングテスト**: `nx lint spotify-automation`コマンドを実行し、ESLintが正常に完了することを確認する。
3.  **E2Eテスト（CI）**: 変更をプッシュした後、GitHub ActionsのCIワークフローが成功することを確認する。特に、`test`と`lint`のジョブで`spotify-automation`が実行対象となっていることをログで確認する。
