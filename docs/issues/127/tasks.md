# Tasks - Issue #127: refactor(spotify-automation): プロジェクト 監査に基づく品質向上と最適化

## 1. 準備
- [x] mainブランチが最新であることを確認し、`feat/127-refactor-spotify-automation` ブランチにいることを確認する (完了)
- [x] `docs/issues/127/` に仕様ドキュメントを作成する (完了)

## 2. セレクタの改善と待機の撤廃 (`NewEpisodePage.ts`)
- [x] `NewEpisodePage` クラスのコンストラクタでセレクタをより堅牢なものに更新する (完了)
- [x] `fillEpisodeDetails` 内の `page.waitForTimeout(2000)` を削除し、適切な `waitFor` に置き換える (完了)
- [x] `publishEpisode` 内の `page.waitForTimeout(2000)` を削除し、適切な待機（要素の有効化待ち等）に置き換える (完了)

## 3. CLIの最適化
- [x] `apps/ui-automations/spotify-automation/scripts/upload.sh` を修正し、`ts-node` から `tsx` に変更する (完了)

## 4. 認証セッションの堅牢化 (`authManager.ts`)
- [x] `AuthState` インターフェースに合わせて `localStorage` / `sessionStorage` を扱うように `AuthManager` クラスを拡張する (完了)
- [x] `saveAuthState` メソッドにストレージ取得処理を追加する (完了)
- [x] `loadAuthState` メソッドにストレージ復元処理を追加する (完了)

## 5. 未使用コードの整理
- [x] `apps/ui-automations/spotify-automation/src/pages/EpisodesPage.ts` を削除する (完了)

## 6. 検証
- [x] 既存のテストを実行し、デグレードが発生していないことを確認する (完了 - E2Eテスト全件パス)
- [x] `upload.sh` を実行し、CLIが正しく動作することを確認する (完了 - E2Eテスト内のCLIテストで検証)
- [x] Lintおよびフォーマットを確認する (完了)