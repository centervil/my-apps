# Tasks: クッキーの有効期限を考慮した厳密な認証チェックの実装

## 1. テスト作成 (TDD)
- [x] `tests/unit/auth/authManager.spec.ts` を作成（または既存テストを確認）。
    - 正常系: 有効期限内のクッキー。
    - 異常系: `expires` が過去の時刻になっているクッキーを含む場合、`AuthError` が発生することを確認するテストケース。

## 2. AuthManager の実装
- [x] `src/auth/authManager.ts` の `isAuthValid` メソッドを修正。
    - `cookies` 配列内の各要素について `expires` をチェックするロジックを追加。
    - 期限切れクッキー検出時に `AuthError` ('EXPIRED_AUTH') をスローする実装。

## 3. SpotifyUploader の修正
- [x] `src/features/spotifyUploader.ts` を修正。
    - `fs.existsSync` のチェックに加え、`AuthManager` をインスタンス化。
    - ブラウザ起動 (`firefox.launch`) 前に `authManager.isAuthValid()` を実行。
    - エラー時のログ出力を確認。

## 4. 検証
- [x] 単体テスト (`pnpm test` -> `npx nx test-unit spotify-automation`) が全てパスすることを確認。
- [x] `runSpotifyUpload` を実行し、既存の正常な認証フローが壊れていないことを確認（リグレッションテスト - CLI実行で検証済）。
- [x] (可能であれば) 認証ファイルのクッキー有効期限を手動で改ざんし、CLIが即座にエラーを返すか動作確認（環境の既存期限切れクッキーにて確認済）。