# Tasks: 認証ファイル保存パスの不整合修正

## 実装タスク

- [ ] **1. ユーティリティモジュールの作成**
    - [ ] `apps/ui-automations/spotify-automation/src/utils/paths.ts` を作成する。
    - [ ] `getSpotifyAuthPath` 関数を実装する。
    - [ ] `ensureAuthDir` 関数を実装する。

- [ ] **2. ユーティリティのテスト作成**
    - [ ] `apps/ui-automations/spotify-automation/tests/utils/paths.spec.ts` を作成する。
    - [ ] 環境変数の有無による分岐ロジックをテストする。
    - [ ] ディレクトリ作成ロジックをテストする。

- [ ] **3. 認証保存スクリプトの修正**
    - [ ] `apps/ui-automations/spotify-automation/scripts/saveAuth.ts` を修正する。
    - [ ] 新しい `paths` モジュールをインポートし、古いパス解決ロジックを置換する。

- [ ] **4. アップローダー機能の修正**
    - [ ] `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` を修正する。
    - [ ] `getAuthPath` 内部ロジックを `paths` モジュール利用に置き換える。

- [ ] **5. Playwright設定の修正**
    - [ ] `apps/ui-automations/spotify-automation/playwright.config.ts` を確認・修正する。
    - [ ] `storageState` の指定を `getSpotifyAuthPath()` (または同等のパス) に変更する。

- [ ] **6. ドキュメント更新**
    - [ ] `apps/ui-automations/spotify-automation/README.md` を更新する。
    - [ ] 認証ファイルの保存場所についての記述を修正する。

## 確認タスク

- [ ] **ユニットテスト実行**
    - [ ] `npx nx test spotify-automation` (または該当テストファイルのみ) を実行しPassすることを確認。

- [ ] **手動動作確認**
    - [ ] `SPOTIFY_AUTH_PATH` 未設定状態で `scripts/saveAuth.ts` を実行し、`~/.my-apps/credentials/` に保存されるか確認。
    - [ ] 保存された認証ファイルを使用して `e2e` テストまたはドライランが動作するか確認。
