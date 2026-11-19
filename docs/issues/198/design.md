# 設計書: Issue #198 日次ルーチンの本番適用（Spotify & note 自動化）

## 1. アーキテクチャ設計
`apps/ui-automations/spotify-automation` パッケージ内の既存の設計（`spotifyUploader.ts`, `cli.ts`, `saveAuth.ts`, `authManager.ts`, `resultReporter.ts`）に準拠する。

### 1.1. ファイル配置と設計判断
- **`src/noteCli.ts`**: note 下書き作成の yargs パーサおよび実行制御ロジック。既存の `src/cli.ts` と同じ構成（`yargs`, `dotenv`, `mapErrorToExecutionResult`, `saveExecutionResult`）を採用。
- **`scripts/note.sh`**: `scripts/upload.sh` と同様のシェルラッパー。`npm run note-draft` の呼び出しを簡略化。設計判断として、Spotify と同様にシェルスクリプトを用意することで本番運用の利便性を統一。
- **`scripts/saveNoteAuth.ts`**: `scripts/saveAuth.ts` のパターンを踏襲し、note のログインセッションを保存するスクリプト。パッケージの `npm run login:note` から実行可能。
- **パス管理**: `src/utils/paths.ts` に `getNoteAuthPath()` を追加し、環境変数 `NOTE_AUTH_PATH` またはリポジトリルートの `credentials/note-auth.json` を解決する。

## 2. 認証とエラーハンドリング
- **認証切れ検知**: note CLI 起動時に `AuthManager` を用い、`NOTE_AUTH_PATH` の存在と有効性をチェック。存在しない場合やログインページにリダイレクトされた場合は `AuthExpiredError`（または `AuthError` with code `AUTH_EXPIRED`）を送出し、`mapErrorToExecutionResult` で `status: 'AUTH_EXPIRED'`, `exitCode: 2` にマッピングする。
- **終了コード規約**:
  - `0`: 成功（または dry-run 成功）
  - `2`: 認証切れ (`AUTH_EXPIRED`)
  - `3`: 一時失敗 (`TRANSIENT_FAILURE`)
  - `1`: その他 / バリデーションエラー (`PERMANENT_FAILURE`, `VALIDATION_ERROR`, etc.)

## 3. テスト戦略
- **単体テスト**: CLI の引数パース、エラーハンドリング、`buildNoteContent` / `performQualityCheck` の統合、認証未達時の `AUTH_EXPIRED` 挙動をモック及びテスト用フィクスチャで検証する（ブラウザ不要）。
- **実機検証**:
  - Spotify アップロード CLI をテスト用ショー（Show ID: `1ptW7cCcrt1Qb3QinuKHc5`）およびテスト音声で実行。
  - note CLI を認証ファイルなしで実行し、終了コード 2 および `AUTH_EXPIRED` 結果 JSON の出力を確認。また `--dryRun` で終了コード 0 を確認。
