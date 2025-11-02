# 要件定義書 (requirements.md)

## 1. 概要

`spotify-automation`プロジェクトをNxワークスペースに統合し、モノレポ全体での開発体験とCI/CDプロセスを統一する。

## 2. ユーザーストーリー

### ユーザーストーリー1

- **役割**: 開発者
- **目的**: `spotify-automation`プロジェクトをNxの管理下に置きたい。
- **理由**: Nxの計算キャッシュや依存関係グラフなどの機能を活用し、開発効率を向上させるため。

#### 受け入れ基準

- `apps/ui-automations/spotify-automation`ディレクトリに`project.json`ファイルが作成されていること。
- `nx graph`コマンドで表示される依存関係グラフに`spotify-automation`プロジェクトが含まれていること。
- `package.json`内の不要なスクリプト（例: `test`, `lint`）が削除されていること。

### ユーザーストーリー2

- **役割**: 開発者
- **目的**: `spotify-automation`プロジェクトのタスクを、他のプロジェクトと同じようにNxコマンドで実行したい。
- **理由**: プロジェクトごとに異なるコマンドを覚える必要をなくし、学習コストとコンテキストスイッチを削減するため。

#### 受け入れ基準

- `nx test spotify-automation`コマンドでPlaywrightのテストが実行できること。
- `nx lint spotify-automation`コマンドでESLintのリンティングが実行できること。
- CIワークフローが、個別の`pnpm`コマンドではなく、`nx affected:*`コマンドを通じて`spotify-automation`のテストとリンティングを実行していること。
