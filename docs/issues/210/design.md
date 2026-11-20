# Design: Issue #210 - note CLI 本文変換の従来体裁一致

## アーキテクチャと変更対象
1. **`apps/ui-automations/spotify-automation/src/features/noteDraftCreator.ts`**:
   - `convertMarkdownToNoteBody` を置き換える、あるいは内部で `convertMarkdownToHtml` を用いた HTML 生成関数を定義。
   - `performQualityCheck` を実体ベース（DOM要素、リテラル `**`、`li` 先頭の `* `/`- `、`<ol>` 存在、空段落数）に強化。
2. **`apps/ui-automations/spotify-automation/src/pages/NoteEditorPage.ts`**:
   - `setBodyAndEmbed` メソッドを刷新：
     - markdown から HTML 生成。
     - `page.evaluate` で `navigator.clipboard.write` (`ClipboardItem` の 'text/html' と 'text/plain')。
     - `page.keyboard.press('Control+v')`。
     - 先頭見出しの DOM チェック & 潰れている場合の `### ` 修復。
     - 目次メニュー（テキスト「目次」）のクリックによる実ブロック挿入と DOM 検証。
3. **単体テスト (`tests/unit/noteDraftCreator.spec.ts` または新設 `noteFormat.spec.ts`)**:
   - `convertMarkdownToHtml` の各ケース（見出し、ul/ol、strong、空行、連続行、段落直後の番号付きリスト）の網羅的テスト。

## 詳細設計: `convertMarkdownToHtml`
- 入力 markdown 文字列をパースして適切な HTML 文字列に変換する純粋関数。
- 変換規則:
  - `## 📚 ...` -> `<h3>...</h3>` (最初のみ、あるいは最初のh2系。指示: "最初の `## 📚`→h3、他の `##`→h2、`###`/`####`→h3")
  - `## ...` -> `<h2>...</h2>`
  - `### ...` / `#### ...` -> `<h3>...</h3>`
  - `* ...` / `- ...` -> `<ul><li>...</li></ul>` (連続するリスト項目を1つの `<ul>` にまとめる)
  - `1. ...` -> `<ol><li>...</li></ul>` (連続する番号付きリスト項目を1つの `<ol>` にまとめる)
  - `**text**` -> `<strong>text</strong>`
  - 空行区切りでブロック分割。
  - 通常行が複数連続する場合、`<br>` で結合して1つの `<p>` もしくはテキストブロックにする。
  - リストが空行なしで段落の直後に続く場合も正しく処理する。
