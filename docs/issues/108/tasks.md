# タスクリスト: spotify-automation CLI の定期実行ワークフロー

- [x] `docs/issues/108/requirements.md` ファイルを作成する
- [x] `docs/issues/108/design.md` ファイルを作成する
- [x] `docs/issues/108/tasks.md` ファイルを作成する
- [x] `.github/workflows/spotify-upload.yml` ファイルを新規作成する
- [x] ワークフローに `schedule` トリガーと `workflow_dispatch` トリガーを設定する
- [x] ジョブの実行環境として `runs-on: self-hosted` を指定する
- [x] リポジトリのチェックアウト、Node.js/pnpmのセットアップ、依存関係のインストールを行うステップを追加する
- [x] `upload.sh` スクリプトを実行するステップを追加する
- [x] スクリプト実行ステップで、GitHub Secrets を利用して環境変数を設定する
- [x] `showId`, `audioPath`, `title` などの引数をスクリプトに渡す処理を実装する
- [x] 作成したワークフローをテストブランチにプッシュし、`workflow_dispatch` を使って手動で動作検証を行う
- [x] 実行ログを確認し、エラーなく処理が完了することを確認する
- [x] プルリクエストを作成し、レビューを依頼する