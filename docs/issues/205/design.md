# Design: Issue 205 - note CLI 公開ステップの追加

## 1. アーキテクチャと設計方針
- `src/pages/NoteEditorPage.ts` を拡張し、ヘッダー画像設定、公開ボタンのクリック、公開設定（ハッシュタグ、マガジン選択、無料設定、最終公開ボタン）の操作メソッドを追加する。
- `src/noteCli.ts` に `--publish`, `--tags`, `--magazine` オプションを追加し、`--publish` が有効かつ品質チェック合格の場合に公開ステップを呼び出す。
- ヘッダー画像取得は、認証済みセッション（Cookies/Headers）を用いて `https://note.com/api/v3/notes/<previousNoteId>` をフェッチし、`eyecatch` 画像を一時ファイルにダウンロードして `input[type="file"]` またはファイルアップロード操作でエディタに設定する。

## 2. セレクタ戦略（実機検証でDOM確認後確定）
- 「公開に進む」ボタン: テキストまたはセレクタを実画面で特定
- 公開設定画面/モーダル: タグ入力欄、マガジン選択、公開ボタンのセレクタを特定

## 3. 結果 JSON の構造
- `success`: boolean
- `status`: `'SUCCESS'` | `'QUALITY_CHECK_FAILED'` | `'PERMANENT_FAILURE'` | その他
- `exitCode`: number
- `details`:
  - `title`: string
  - `noteId`: string
  - `draftUrl`: string
  - `publishedUrl`: string (公開成功時)
  - `eyecatchResult`: { success: boolean, message?: string }
  - `qualityCheck`: QualityCheckResult
