# 作業タスクリスト

## issue #102: feat: ラッパースクリプトと設定ファイルのサポートによるCLIのユーザビリティ向上

-   [ ] **ブランチ作成**: `feat/102-feat-cli` ブランチを作成する (完了済み)
-   [ ] **仕様定義**: `requirements.md`, `design.md`, `tasks.md` を作成する (本タスク)

### 開発タスク

-   [ ] **`yargs` の導入**: `spotify-automation` プロジェクトに `yargs` と `@types/yargs` を追加する。
-   [ ] **設定ファイル読み込み機能の実装**:
    -   [ ] `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` を修正する。
    -   [ ] `--config` 引数を `yargs` で定義する。
    -   [ ] 指定されたJSONファイルを読み込み、パースするロジックを追加する。
    -   [ ] コマンドライン引数と設定ファイルの内容をマージするロジックを追加する。
-   [ ] **ラッパースクリプトの作成**:
    -   [ ] `apps/ui-automations/spotify-automation/scripts/upload.sh` を作成する。
    -   [ ] スクリプトに `ts-node` の実行コマンドを記述する。
    -   [ ] スクリプトに実行権限を付与する (`chmod +x`)。
-   [ ] **テストの実装**:
    -   [ ] 設定ファイルのマージロジックに関する単体テストを `spotifyUploader.spec.ts` に追加する。
    -   [ ] `upload.sh` を使用したE2Eテストを `cli.spec.ts` に追加または修正する。
-   [ ] **ドキュメントの更新**:
    -   [ ] `apps/ui-automations/spotify-automation/README.md` を更新する。
    -   [ ] `upload.sh` の使用方法を追記する。
    -   [ ] 設定ファイルの使用方法と例を追記する。

### 後処理

-   [ ] **動作確認**: ローカル環境で `upload.sh` を使って一連の動作を確認する。
-   [ ] **コードレビュー**: プルリクエストを作成し、レビューを依頼する。
-   [ ] **マージ**: レビュー完了後、`main` ブランチにマージする。