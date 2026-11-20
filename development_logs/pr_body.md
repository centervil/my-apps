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
   - テスト記事 ID / キー: `n6f2d31e7a104` / `n6e8f680877ba`
   - 公開 URL: `https://note.com/clever_chives813/n/n6f2d31e7a104` / `https://note.com/clever_chives813/n/n6e8f680877ba`
   - タグ: `#CRISC`
   - マガジン: `CRISC 30日間学習`
   - note API レスポンス実測データ:
     - `hashtag_notes`:
       ```json
       "hashtag_notes": [
         {
           "created_at": "2026-11-20T03:15:22.000+09:00",
           "hashtag": {
             "name": "#CRISC"
           },
           "id": 1389312456
         }
       ]
       ```
     - `belonging_magazine_keys`:
       ```json
       "belonging_magazine_keys": [
         "m709ca5680512"
       ]
       ```

## テスト方法
1. `npx nx run spotify-automation:test` を実行し、全単体テスト（24件）が合格することを確認。
2. `pnpm lint` を実行し、Lintエラーがないことを確認。
