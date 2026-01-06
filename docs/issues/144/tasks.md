# Tasks: 開発環境PR/Push時のRunner環境自動リグレッションテスト構築（DRY対応）

## 1. `private-ops` リポジトリ改修

### 1-1. Reusable Workflow 作成
- [x] 既存の `spotify-automation.yml` の処理内容を分析・抽出する
- [x] `.github/workflows/reusable-spotify-upload.yml` を新規作成する
  - [x] `inputs` 定義 (`ref`, `config_file`)
  - [x] `runs-on` 設定（Self-hosted Runner）
  - [x] Checkout ステップ実装
  - [x] Setup ステップ実装
  - [x] Config Loading ステップ実装
  - [x] Upload Execution ステップ実装

### 1-2. 本番ワークフロー (`spotify-automation.yml`) 改修
- [x] 既存のステップを削除し、Reusable Workflow の呼び出し (`uses`) に置き換える
- [x] `workflow_dispatch` と `repository_dispatch` の入力を Reusable Workflow の inputs にマッピングする
- [x] コミットし、構文エラーがないか確認する

### 1-3. リグレッションワークフロー (`spotify-regression.yml`) 作成
- [x] `.github/workflows/spotify-regression.yml` を新規作成する
- [x] トリガー `repository_dispatch` (types: `spotify-regression`) を設定する
- [x] Reusable Workflow を呼び出す
  - [x] `ref`: `${{ github.event.client_payload.ref }}`
  - [x] `config_file`: `'test-show.json'`

## 2. `my-apps` リポジトリ実装

### 2-1. トリガーワークフロー作成
- [x] `.github/workflows/trigger-spotify-regression.yml` を新規作成する
- [x] トリガー設定 (`push` to main, `pull_request` to main)
- [x] `repository_dispatch` 送信ステップの実装
  - [x] `peter-evans/repository-dispatch` アクション等の利用
  - [x] Token: `${{ secrets.G_ACCESS_TOKEN }}`
  - [x] Repository: `centervil/private-ops`
  - [x] Event Type: `spotify-regression`
  - [x] Client Payload: `ref` の動的設定

## 3. 動作検証

- [ ] `private-ops` 側の変更を反映させる（master/main マージまたは対象ブランチでの検証）
- [ ] `my-apps` 側でダミーの PR を作成する
- [ ] `my-apps` の Action が成功することを確認
- [ ] `private-ops` 側で `spotify-regression` ワークフローが起動することを確認
- [ ] Runner 上で `test-show.json` を用いて処理が実行されていることをログで確認
