# Design: Issue #184 note 下書きの自動作成

## 1. アーキテクチャ配置
既存の `apps/ui-automations/spotify-automation/` のパターンに倣い、`apps/ui-automations/note-automation/` または `spotify-automation` 内に統合モジュールとして実装する。今回は関連が深いため `apps/ui-automations/spotify-automation/` を拡張し、note 下書き作成機能（`src/features/noteDraftCreator.ts`, `src/pages/NoteEditorPage.ts` など）を追加する。

## 2. 変換ロジック仕様
### 逐語変換 & 見出しマッピング
- **学習編**:
  - 先頭の `## 📚 ...` -> `### 📚 ...` (h3)
  - その他の `##` -> `##` (h2)
  - `###` -> `###` (h3)
  - `####` -> `###` または `####`
- **ニュース編**:
  - レポートの `# <対象日> サイバーセキュリティニュースまとめ` は記事タイトルとして扱うため本文には含めない。
  - 内部の `##` や `###` も正本のルールに従い変換。

### Spotify 埋め込みプレイヤー変換
- Spotify の番組 URL（例: `https://open.spotify.com/show/...`）を挿入後、末尾で `Enter` キーを入力または note の URL 埋め込みポップアップ操作を通じてプレイヤーウィジェットに変換する。

## 3. 品質チェック自動化
- 自動チェック結果を `note-quality-report.json` に出力：
  - `verbatimCheck`: boolean
  - `tocPositionCheck`: boolean
  - `embedPlayerCheck`: boolean
