## 概要
Issue #207 マガジン適用方式の変更（マガジン適用を公開後の独立ステップにする方式への刷新）を実装しました。

## 主な変更点
1. **マガジン適用を公開後の独立ステップにする方式への変更**：
   - note CLI の `--publish` フローにおいて、まず通常どおり公開を完了させる。
   - 公開完了後、公開した記事の編集画面 (`https://editor.note.com/notes/<noteId>/edit`) を開き、「公開に進む」→ 公開設定モーダルで「記事の追加」メニューを開き、対象マガジン行の「追加」ボタンをクリック。
   - ボタンの class に `bg-custom-accent` が含まれること、あるいはテキストが `追加済` になることを確認してから「更新する」をクリック。
   - 最後に **note API（`GET https://note.com/api/v3/notes/<noteId>`）で `belonging_magazine_keys` が空でないことを確認**。空の場合は1回だけ再試行し、それでも空なら `magazineApplied = null`、ステータス `PUBLISH_SETTINGS_FAILED`（終了コード1）とする。
2. **実機検証結果**：
   - テスト記事タイトル: 「CRISC 動作確認 30日間学習Day1」
   - 検証ではテスト記事を計5件公開した。CLI のマガジン適用は最初の4件で失敗し（`belonging_magazine_keys` が空のまま、2回試行後 `magazineApplied: null`）、行特定セレクタの修正後に公開した5件目で成功した。
     - `n6f2d31e7a104` — 失敗（`[]`）。デバッグ中の手動プローブで `['me346db4639ed', 'm709ca5680512']` が付いた（`me346db4639ed` は行の誤指定による余分なマガジン）。
     - `n757e109e62be` — 失敗（`[]`）。
     - `n5ed54e4a9912` — 失敗（`[]`）。
     - `n02f1379b7a12` — 失敗（`[]`）。
     - `n6e8f680877ba` — **成功**。`magazineApplied: 'CRISC 30日間学習'`、`belonging_magazine_keys: ['m709ca5680512']`（1回目の試行で確認）。
   - 成功記事の note API レスポンス実測データ（`GET https://note.com/api/v3/notes/n6e8f680877ba`、マネージャーが公開 API で独立確認）:
     - `hashtag_notes`:
       ```json
       "hashtag_notes": [
         {
           "id": 1390454745,
           "created_at": "2026-11-20T17:47:31.000+09:00",
           "hashtag": { "name": "#205" }
         },
         {
           "id": 1390454746,
           "created_at": "2026-11-20T17:47:31.000+09:00",
           "hashtag": { "name": "#CRISC" }
         }
       ]
       ```
       `#205` はテスト用フィクスチャ本文中の「Issue #205 および #207 …」がハッシュタグとして拾われたもので、CLI が適用したタグは `#CRISC` のみ（結果 JSON の `tagsApplied: ["CRISC"]` と一致）。
     - `belonging_magazine_keys`:
       ```json
       "belonging_magazine_keys": [
         "m709ca5680512"
       ]
       ```
   - 結果 JSON（`note-draft-result.json`、コミット対象外）: `noteId: n6e8f680877ba`、`magazineApplied: 'CRISC 30日間学習'`、ステータス `SUCCESS`、終了コード 0。
   - クリーンアップ（マネージャーが実施、2026-11-20）: テスト記事5件すべてを削除し、公開 API の GET が5件とも 404 になることを確認済み。
   - 既知の残課題: 本 PR で追加した CLI の `deleteNote` は、存在しない詳細設定タブの削除ボタンを前提としており動作しない。削除は「自分の記事」一覧 UI（`DELETE /api/v1/notes/n/<key>`）経由で実施した。別 Issue で対応予定。

## テスト方法
1. `npx nx run spotify-automation:test` を実行し、全単体テスト（24件）が合格することを確認。
2. `pnpm lint` を実行し、Lintエラーがないことを確認。
