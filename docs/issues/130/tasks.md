# Tasks - Issue #130

- [x] **Step 1: パス解決ロジックの実装**
    - [x] `apps/ui-automations/spotify-automation/src/utils/paths.ts` を編集する。
    - [x] 関数 `getScreenshotDir()` または `resolveScreenshotPath()` を追加する。
    - [x] 環境変数 `SPOTIFY_AUTOMATION_OUTPUT_DIR` のチェック実装。
    - [x] デフォルトパス（`dist/apps/ui-automations/spotify-automation/screenshots`）の設定。
    - [x] ディレクトリ作成処理 (`mkdir -p`) の追加。

- [x] **Step 2: SpotifyUploaderの修正**
    - [x] `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` を編集する。
    - [x] `path.resolve(process.cwd(), 'error-screenshot.png')` を削除。
    - [x] Step 1で作成した関数を使用してパスを取得するように変更。
    - [x] ファイル名にタイムスタンプを含める処理の実装。

- [x] **Step 3: テストと検証**
    - [x] ローカル環境で環境変数を指定して実行し、スクリーンショットが指定場所に保存されるか確認。
    - [x] 環境変数なしで実行し、デフォルト場所に保存されるか確認。

- [x] **Step 4: ドキュメント更新 (Option)**
    - [x] `README.md` に環境変数 `SPOTIFY_AUTOMATION_OUTPUT_DIR` についての記述を追加する。
