# 作業タスクリスト (tasks.md)

Issue #93 の実装を以下のタスクに分割して進める。

## フェーズ 1: 実装

- [ ] **`spotifyUploader.ts` の修正**
    - [ ] `runSpotifyUpload` 関数のシグネチャを、`title` と `description` の2つの文字列引数を受け取るように変更する。
    - [ ] Playwrightの `page.fill()` や `page.type()` を使用している箇所で、ハードコードされたタイトルと説明を、関数の引数で渡された `title` と `description` 変数に置き換える。

- [ ] **`scripts/upload.ts` の修正**
    - [ ] `process.argv` をスライスして、コマンドライン引数を解析するロジックを追加する。
    - [ ] `--title` と `--description` の引数と、その値を抽出する処理を実装する。
    - [ ] `title` または `description` が取得できなかった場合に、エラーメッセージをコンソールに出力し、`process.exit(1)` でプロセスを終了するバリデーション処理を追加する。
    - [ ] `runSpotifyUpload` 関数の呼び出しを修正し、解析して得られた `title` と `description` を引数として渡す。

## フェーズ 2: テストとドキュメント

- [ ] **手動テスト**
    - [ ] 正常系: `pnpm exec ts-node scripts/upload.ts --title "..." --description "..."` を実行し、意図した通りにエピソードがアップロードされることを確認する。
    - [ ] 異常系: 引数が不足しているパターン (`--title` のみ、`--description` のみ、両方なし) でスクリプトを実行し、エラーメッセージが表示されて処理が中断されることを確認する。

- [ ] **ドキュメント更新**
    - [ ] (任意) `README.md` または関連するドキュメントに、`scripts/upload.ts` の新しい使い方として `--title` と `--description` 引数について追記する。

## フェーズ 3: プルリクエスト

- [ ] 全ての変更をステージングし、Conventional Commits の規約に従ったメッセージでコミットする。
- [ ] `main` ブランチへのプルリクエストを作成する。
