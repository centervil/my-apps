# タスクリスト: `spotify-automation` CLI E2Eテスト

## フェーズ1: 準備と基本テストの実装

- [ ] `apps/ui-automations/spotify-automation/tests/e2e/` ディレクトリを作成する。
- [ ] `apps/ui-automations/spotify-automation/tests/e2e/fixtures/` ディレクトリを作成する。
- [ ] `fixtures` ディレクトリに、テスト用の小さなダミー音声ファイル (`test-audio.mp3`) を追加する。
- [ ] `e2e` ディレクトリに、新しいテストファイル `cli.spec.ts` を作成する。
- [ ] `cli.spec.ts` 内に、CLIコマンドをサブプロセスとして実行するためのヘルパー関数 (`runCli`) を実装する。
- [ ] 最初の異常系テストケースを実装する: `--showId` が指定されなかった場合にエラー終了することを確認する。

## フェーズ2: 正常系シナリオのテスト実装

- [ ] ローカルの音声ファイルを `--audioPath` で指定してアップロードが成功するE2Eテストを実装する。
- [ ] Google Driveから最新のファイルを自動検出し、アップロードが成功するE2Eテストを実装する。

## フェーズ3: 異常系シナリオのテスト実装

- [ ] 不正なSpotify認証情報によりログインに失敗するE2Eテストを実装する。
- [ ] `--audioPath` で指定されたファイルが存在しない場合にエラー終了するE2Eテストを実装する。
- [ ] Google Driveの認証に失敗するE2Eテストを実装する。
- [ ] Google Driveフォルダにアップロード対象のファイルが存在しない場合にエラー終了するE2Eテストを実装する。

## フェーズ4: ドキュメントと最終化

- [ ] `apps/ui-automations/spotify-automation/README.md` を更新し、E2Eテストの実行方法に関するセクションを追加する。
    - [ ] 必要な環境変数 (`.env` ファイル) について記載する。
    - [ ] Google Driveのテスト用フォルダ構成など、事前準備について記載する。
    - [ ] テスト実行コマンド (`pnpm nx test spotify-automation` など) を記載する。
- [ ] すべてのテストが `pnpm nx affected:test` でパスすることを確認する。
- [ ] コード全体をレビューし、可読性と保守性のためにリファクタリングする。
