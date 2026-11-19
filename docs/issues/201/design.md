# Issue 201 設計書 (design.md)

## 1. コンポーネント設計・変更方針

### NoteEditorPage (`apps/ui-automations/spotify-automation/src/pages/NoteEditorPage.ts`)
- **`navigateToNewNote`**:
  - `https://editor.note.com/new` に遷移後、URL が `/notes/([a-zA-Z0-9_]+)/edit` の形式にリダイレクトされるまで待機する。
  - URL から Note ID (`noteId`) を抽出して返せるようにするヘルパー関数 / メソッドを提供する。
- **`setTitle`**:
  - タイトル要素: `textarea[placeholder="記事タイトル"]` または `textarea` を対象にし、`fill` または `focus` + `type` で入力を確実に反映する。
- **`setBodyAndEmbed`**:
  - 本文エリア: `div.ProseMirror` または `div[contenteditable="true"]` を対象とする。
  - テキスト投入: Playwright で ProseMirror 要素をクリック・フォーカスし、テキストを入力（または段落ごとに `fill`/`type` やクリップボード等で投入）。
  - Spotify 番組 URL の埋め込みプレイヤー変換: Spotify URL を貼り付け/入力後、埋め込みカード/iframe または埋め込み要素が DOM に生成されることを確認する。
- **品質チェック3点**:
  1. 本文 verbatim チェック (本文テキストが含まれるか)
  2. 目次位置チェック (目次要素が存在またはテキストに含まれるか)
  3. 埋め込みプレイヤー変換チェック (Spotify 埋め込み要素が存在するか)
- **`saveDraft`**:
  - エディタ上の「下書き保存」ボタンをクリックし、保存完了のインジケータ（「保存しました」等）を待機する。絶対に「公開に進む」や公開ボタンを押さない。

### noteCli (`apps/ui-automations/spotify-automation/src/noteCli.ts`)
- CLI 出力の `details` オブジェクトに `noteId` および `draftUrl` (例: `https://editor.note.com/notes/<noteId>/edit/`) を追加する。

### テスト設計
- **単体テスト** (`apps/ui-automations/spotify-automation/tests/unit/noteCli.spec.ts` / `NoteEditorPage.spec.ts`):
  - URL から note ID を抽出するユーティリティ関数の単体テストを作成。
- **実機検証**:
  - 実認証 (`credentials/note-auth.json`) 下で Headless または Headed ブラウザを用いて CLI を実行し、実環境の Note エディタ DOM との一致を検証する。

## 2. 影響範囲
- `apps/ui-automations/spotify-automation/src/pages/NoteEditorPage.ts`
- `apps/ui-automations/spotify-automation/src/noteCli.ts`
- `apps/ui-automations/spotify-automation/tests/unit/`

## 3. 安全性・制約遵守
- 公開ボタンの操作は絶対に行わず、下書き保存のみ実行する。
- `credentials/note-auth.json` や機密情報は `.gitignore` に含まれていることを確認し、絶対コミットしない。
- 新規 npm パッケージ追加なし。
