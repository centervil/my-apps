# Requirements: 開発環境PR/Push時のRunner環境自動リグレッションテスト構築（DRY対応）

## ユーザーストーリー

1. **自動リグレッションテスト実行**
   - **として**: 開発者
   - **私は**: `my-apps` リポジトリへの Pull Request 作成・更新時、または `main` ブランチへの Push 時に、自動的に `private-ops` 環境でリグレッションテストが実行されることを望む
   - **それにより**: 本番環境と同等の環境で、変更が既存機能（特にアップロード処理）を破壊していないことを即座に確認できる。

2. **ワークフロー定義の共通化 (DRY)**
   - **として**: DevOps エンジニア
   - **私は**: 本番用とテスト用のワークフローで、アップロード処理の定義を共通化（Reusable Workflow 化）したい
   - **それにより**: 手順の二重管理を防ぎ、本番手順の変更が自動的にテストにも適用されるようにして保守性を高める。

3. **テスト用設定の強制**
   - **として**: 開発者
   - **私は**: リグレッションテスト実行時には、必ずテスト用設定ファイル (`test-show.json`) が使用されることを保証したい
   - **それにより**: テスト実行による本番データへの意図しない影響（誤送信など）を防止する。

## 受け入れ基準 (Acceptance Criteria)

### 1. Reusable Workflow (`private-ops`)
- [ ] `private-ops/.github/workflows/reusable-spotify-upload.yml` が作成されていること。
- [ ] 以下の処理が共通化されていること：
    - ソースコードのチェックアウト（入力された `ref` を使用）
    - 環境セットアップ（Git, pnpm, Firefox 等）
    - 設定ファイルの読み込み（入力された `config_file` を使用）
    - アップロード処理の実行（`pnpm run upload`）
- [ ] Inputs として `ref` と `config_file` を受け取れること。

### 2. 本番ワークフローの改修 (`private-ops`)
- [ ] `private-ops/.github/workflows/spotify-automation.yml` が Reusable Workflow を呼び出すように変更されていること。
- [ ] 既存のトリガー（`repository_dispatch`, `workflow_dispatch`）で引き続き動作すること。
- [ ] `config_file` が動的に（入力値またはデフォルト値で）渡されること。

### 3. リグレッションテストワークフローの実装 (`private-ops`)
- [ ] `private-ops/.github/workflows/spotify-regression.yml` が新規作成されていること。
- [ ] `repository_dispatch` (event_type: `spotify-regression`) でトリガーされること。
- [ ] Reusable Workflow を呼び出し、`config_file` に **`test-show.json`** を固定で渡していること。
- [ ] ペイロードから受け取った `ref` を Reusable Workflow に渡していること。

### 4. トリガーワークフローの実装 (`my-apps`)
- [ ] `my-apps/.github/workflows/spotify-regression-trigger.yml`（仮名）が作成されていること。
- [ ] `main` ブランチへの `push` および `pull_request` でトリガーされること。
- [ ] `private-ops` リポジトリに対して `repository_dispatch` (type: `spotify-regression`) を送信すること。
- [ ] ペイロードの `ref` に、テスト対象のブランチ名（PRの場合は `head_ref`、Pushの場合は `ref_name`）が正しく設定されていること。
- [ ] `G_ACCESS_TOKEN` シークレットを使用して認証が行われていること。
