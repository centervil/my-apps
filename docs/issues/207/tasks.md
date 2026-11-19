# タスク一覧: note 公開時のタグ・マガジン適用確実化 (#207)

- [ ] 1. 現状の `src/pages/NoteEditorPage.ts` および関連テストを確認する
- [ ] 2. `src/pages/NoteEditorPage.ts` の `publishNote` にタグのチップ確認・リトライロジックを実装する
- [ ] 3. `src/pages/NoteEditorPage.ts` の `publishNote` にマガジン選択 UI オープン・選択確認ロジックを実装する
- [ ] 4. 適用結果（`tagsApplied`, `magazineApplied`）を `details` に含めるよう実装を修正する
- [ ] 5. `src/noteCli.ts` にて適用不一致時の終了コード制御を追加する
- [ ] 6. 単体テストの追加・更新を実施し、テストと lint を通過させる
- [ ] 7. 実機検証（テスト記事公開、note API での確認、テスト記事削除）を実施する
- [ ] 8. 開発ログ作成、Conventional Commits によるコミット、push、PR 作成
