# タスクリスト (tasks.md)

## `/dev-start` コマンド改修

-   [x] `jq` がインストールされていることを確認、またはインストールする。
-   [x] `.gemini/commands/dev-start.toml` のプロンプトを更新する。
-   [x] `gh issue view` を使ってissue情報を取得するロジックを追加する。
-   [x] `AGENTS.MD` の規約に沿ったブランチ名を動的に生成するロジックを追加する。
-   [x] `mkdir` を使って `docs/issues/[issue番号]` ディレクトリを作成するロジックを追加する。
-   [x] issue情報を後続のLLMに渡し、仕様書3点 (`requirements.md`, `design.md`, `tasks.md`) を生成させるプロンプトを追加する。

## `/dev-end` コマンド改修

-   [x] `.gemini/commands/dev-end.toml` のプロンプトを更新する。
-   [x] `gh pr create` を使ってプルリクエストを作成するロジックを追加する。
-   [x] `gh pr checks --watch` を使ってCIの完了を待つロジックを追加する。
-   [x] CIの結果に応じて処理を分岐させるロジックを追加する。
    -   [x] 成功時: `git checkout main` を実行する。
    -   [x] 失敗時: `gh pr checks` でエラー内容を表示し、ユーザーに修正を促す。

## 動作確認

-   [x] `gh auth status` で認証が通っていることを確認する。
-   [x] `main` ブランチで `/dev-start` のテストを実行し、ブランチとディレクトリが作成されることを確認する。
-   [ ] `/dev-end` のテストを実行し、PR作成とCI連携が機能することを確認する。
-   [ ] 作成したファイルをコミットし、最終的なPRを作成する。