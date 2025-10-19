---
title: "設計書: spotify-automationプロジェクトのCI改善"
---

## 1. 概要

本ドキュメントは、`spotify-automation`プロジェクトのCIワークフローを改善するための技術設計を定義する。主な変更点は、GitHub Actionsワークフロー（`.github/workflows/ci.yml`）を修正し、プルリクエストごとに静的解析（Lint）のみを実行するように構成することである。

## 2. 現状のアーキテクチャと課題

- **CIトリガー**: 現在のワークフローは、`github.event_name` が `pull_request` でない場合にのみ実行される（`if: ${{ github.event_name != 'pull_request' }}`）。これにより、プルリクエストでの自動チェックが行われない。
- **ジョブ内容**: `test`ジョブ内で、依存関係のインストールからPlaywrightのセットアップ、E2Eテストの実行まで、複数の責務が混在している。これにより、静的解析のみを独立して実行できず、CIの実行時間が長くなっている。
- **プロジェクト構成**: `spotify-automation`は`pnpm`ワークスペース内の1プロジェクトであり、ルートの`package.json`に`lint`スクリプトが定義されている（`"lint": "nx run-many --target=lint --all"`）。

## 3. 設計方針

CIワークフローを「静的解析専用」に特化させ、シンプルかつ高速に実行できるように再設計する。

### 3.1. ワークフローファイルの修正 (`.github/workflows/ci.yml`)

#### 3.1.1. トリガーの変更

ワークフローがプルリクエストと`main`ブランチへのプッシュの両方でトリガーされるように、`on`セクションを以下のように修正する。

```yaml
on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
```

#### 3.1.2. ジョブの再構成

既存の`test`ジョブを`lint`に名称変更し、その責務を静的解析のみに限定する。

- **`if`条件の削除**: ジョブレベルの`if: ${{ github.event_name != 'pull_request' }}`という条件分岐を完全に削除する。これにより、プルリクエスト時にもジョブが実行されるようになる。
- **ステップの簡素化**: ジョブ内のステップを以下のように整理する。
    1.  **Checkout**: `actions/checkout@v4`を使用してリポジトリをチェックアウトする。
    2.  **Setup Node.js and pnpm**: `pnpm/action-setup`を使用してNode.jsとpnpm環境をセットアップする。
    3.  **Install Dependencies**: `pnpm install`を実行して、リポジトリ全体の依存関係をインストールする。
    4.  **Run Lint**: `pnpm lint`を実行して、`spotify-automation`を含む全プロジェクトの静的解析を実行する。

#### 3.1.3. 不要なステップの削除

以下のPlaywright関連のステップは、CIの責務外となるため完全に削除する。

- `Run Playwright install-deps`
- `Run Playwright install`
- `Run Playwright test`
- `Upload test report`

### 3.2. 修正後のワークフロー（抜粋）

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 8

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run lint
        run: pnpm lint
```

## 4. テスト戦略

- **単体テスト**: 本変更はCIワークフローの設定に関するものであり、アプリケーションコードの変更は含まないため、単体テストは不要。
- **統合テスト（CI上での検証）**:
    1.  本変更を適用したブランチから、`main`ブランチに対してプルリクエストを作成する。
    2.  GitHub Actions上で`lint`ジョブが自動的にトリガーされ、成功することを確認する。
    3.  意図的にLintエラーを含むコードをプッシュし、CIジョブが正しく失敗することを検証する。
    4.  プルリクエストをマージした後、`main`ブランチへのプッシュをトリガーとして`lint`ジョブが再度実行され、成功することを確認する。

## 5. エラーハンドリング

- `pnpm install`または`pnpm lint`が失敗した場合、CIジョブは終了コード`1`で失敗する。これにより、GitHubはプルリクエストに失敗ステータスを自動的に付与し、マージをブロックする（ブランチ保護ルールが設定されている場合）。
