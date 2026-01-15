# Requirements: CIワークフローの修正

## 1. 概要
`.github/workflows/ci.yml` が構文エラーまたは設定ミスにより実行されない問題を解消し、CI（継続的インテグレーション）が正常に機能するようにする。これにより、PR作成時等の自動テストとLintチェックを復旧させる。

## 2. ユーザーストーリー

### US1: CIジョブの正常実行
- **As a** 開発者
- **I want** プルリクエストを作成または更新した際に CI ワークフローが正常にスケジュールされ、実行されること
- **So that** コードの品質（Lint, Test）が自動的にチェックされることを保証できる

### US2: 実行ログの確認
- **As a** 開発者
- **I want** GitHub Actions の実行ログでビルド、Lint、テストの結果を確認できること
- **So that** エラー発生時に原因を特定できる

## 3. 受け入れ基準 (Acceptance Criteria)

### AC1: Workflow File Issue の解消
- GitHub Actions のタブで `ci.yml` に関する "workflow file issue" や構文エラーが表示されないこと。

### AC2: ジョブの完遂
- `main` ブランチへのプッシュ、または `main` へのプルリクエストに対してワークフローがトリガーされること。
- `Build and Test` ジョブがエラーなく開始され、ステップ（pnpm setup, install, lint, test）が実行されること（テスト自体の成否は問わないが、ワークフロー自体の起動失敗はNG）。

### AC3: 適切な設定値
- pnpm のバージョン指定など、依存アクションのパラメータが有効な値に修正されていること。
