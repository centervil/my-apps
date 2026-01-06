# Tasks: 開発環境PR/Push時のRunner環境自動リグレッションテスト構築（DRY対応）

## 1. `private-ops` リポジトリ改修

### 1-1. Reusable Workflow 作成
- [ ] 既存の `spotify-automation.yml` の処理内容を分析・抽出する
- [ ] `.github/workflows/reusable-spotify-upload.yml` を新規作成する
  - [ ] `inputs` 定義 (`ref`, `config_file`)
  - [ ] `runs-on` 設定（Self-hosted Runner）
  - [ ] Checkout ステップ実装
  - [ ] Setup ステップ実装
  - [ ] Config Loading ステップ実装
  - [ ] Upload Execution ステップ実装

### 1-2. 本番ワークフロー (`spotify-automation.yml`) 改修
- [ ] 既存のステップを削除し、Reusable Workflow の呼び出し (`uses`) に置き換える
- [ ] `workflow_dispatch` と `repository_dispatch` の入力を Reusable Workflow の inputs にマッピングする
- [ ] コミットし、構文エラーがないか確認する

### 1-3. リグレッションワークフロー (`spotify-regression.yml`) 作成
- [ ] `.github/workflows/spotify-regression.yml` を新規作成する
- [ ] トリガー `repository_dispatch` (types: `spotify-regression`) を設定する
- [ ] Reusable Workflow を呼び出す
  - [ ] `ref`: `${{ github.event.client_payload.ref }}`
  - [ ] `config_file`: `'test-show.json'`

## 2. `my-apps` リポジトリ実装

### 2-1. トリガーワークフロー作成
- [ ] `.github/workflows/trigger-spotify-regression.yml` を新規作成する
- [ ] トリガー設定 (`push` to main, `pull_request` to main)
- [ ] `repository_dispatch` 送信ステップの実装
  - [ ] `peter-evans/repository-dispatch` アクション等の利用
  - [ ] Token: `${{ secrets.G_ACCESS_TOKEN }}`
  - [ ] Repository: `centervil/private-ops`
  - [ ] Event Type: `spotify-regression`
  - [ ] Client Payload: `ref` の動的設定

## 3. 動作検証

- [ ] `private-ops` 側の変更を反映させる（master/main マージまたは対象ブランチでの検証）
- [ ] `my-apps` 側でダミーの PR を作成する
- [ ] `my-apps` の Action が成功することを確認
- [ ] `private-ops` 側で `spotify-regression` ワークフローが起動することを確認
- [ ] Runner 上で `test-show.json` を用いて処理が実行されていることをログで確認
