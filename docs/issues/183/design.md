# Design: Issue #183 - Spotify 自動化の堅牢化

## アーキテクチャと変更コンポーネント

### 1. セッション検証の拡張 (`AuthManager` / `spotifyUploader.ts`)
- `AuthManager.isAuthValid()` の拡張に加え、実際のブラウザコンテキスト起動後に Spotify の Creators ページ（またはダッシュボード）にアクセスしてログイン状態が有効か（ログイン画面にリダイレクトされないか、あるいは特定のログイン要素が存在しないか）をライブで検証する仕組みを設計する。
- 無人実行環境のため、ライブ検証ができない/モックの場合も含め、`AuthError`（特に `EXPIRED_AUTH` や `INVALID_SESSION`）を明確に識別できるようにする。

### 2. リトライ機構 (`retryUtils.ts` または `spotifyUploader.ts`)
- 操作やステップ（あるいはアップロード処理全体）をラップする汎用的なリトライラッパー関数を実装する。
- エラーの分類 (`ErrorType`: `TRANSIENT` vs `PERMANENT`) を導入する。
  - `PERMANENT`（`AuthError`, `FileNotFoundError`, `ValidationError` 等）: リトライせず即座に投げる。
  - `TRANSIENT`（ネットワークエラー、TimeoutError 等）: 設定回数までバックオフ付きでリトライ。

### 3. 結果レポート (`executionResult.ts` / CLI)
- 実行結果インターフェース:
  ```ts
  export interface ExecutionResult {
    success: boolean;
    status: 'SUCCESS' | 'AUTH_EXPIRED' | 'TRANSIENT_FAILURE' | 'PERMANENT_FAILURE' | 'UNKNOWN_ERROR';
    errorCode?: string;
    message?: string;
    timestamp: string;
    durationMs: number;
    details?: Record<string, any>;
  }
  ```
- 実行結果を JSON ファイル（例: `spotify-automation-result.json` または指定パス）および標準出力に必ず残す。
- 終了コードの割り当て:
  - `0`: 成功 (`SUCCESS`)
  - `1`: 一般エラー / 永続的失敗 (`PERMANENT_FAILURE`, `VALIDATION_ERROR`)
  - `2`: 認証切れ (`AUTH_EXPIRED`)
  - `3`: 一時的失敗（リトライ上限超過） (`TRANSIENT_FAILURE`)

## テスト計画
- **Unit Tests**:
  - リトライ機構のテスト（一時エラーでリトライ成功、上限超過で失敗、恒常エラーで即時失敗）
  - セッション検証・エラーコード分類のテスト
  - 結果レポートの JSON 出力形式のテスト
- **E2E Tests**:
  - ドライランおよびエラー時の挙動確認
