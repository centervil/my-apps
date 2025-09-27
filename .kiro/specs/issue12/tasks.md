# タスクリスト: Issue #12 - 「新しいエピソード」ページでの音声ファイルアップロード

## 1. 目的

Issue #12の要件定義と設計に基づき、具体的な実装タスクを定義する。

## 2. タスク一覧

### フェーズ 1: 準備

-   [ ] `apps/ui-automations/spotify-automation/tests/fixtures/` ディレクトリを作成する。
-   [ ] テスト用のダミー音声ファイル（例: `test-audio.mp3`）を作成し、上記ディレクトリに配置する。

### フェーズ 2: テスト駆動開発（TDD） - Red

-   [ ] `apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts` に、音声ファイルをアップロードする新しいテストケースを追加する。この時点では、`uploadAudioFile` メソッドが未実装なため、テストは失敗する（Redフェーズ）。

### フェーズ 3: ページオブジェクトの実装 - Green

-   [ ] `apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts` を開く。
-   [ ] Playwright Inspectorやブラウザの開発者ツールを使い、ファイルアップロードのための `<input type="file">` 要素のロケーターを特定する。
-   [ ] 特定したロケーターを `NewEpisodePage.ts` に追加する。
-   [ ] `uploadAudioFile(filePath: string)` メソッドを `NewEpisodePage.ts` に実装する。内部では `locator.setInputFiles()` を使用する。

### フェーズ 4: テストの完成とリファクタリング - Refactor

-   [ ] `newEpisode.spec.ts` のテストケースを更新し、実装した `uploadAudioFile()` メソッドを正しく呼び出すように修正する。
-   [ ] ファイルアップロード成功を検証するためのアサーション（`expect`）を追加する（例: アップロードされたファイル名がページに表示されることを確認）。
-   [ ] テストを実行し、パスすることを確認する（Greenフェーズ）。
-   [ ] コードとテストの可読性や効率性を向上させるためのリファクタリングを行う。

### フェーズ 5: 最終確認

-   [ ] `spotify-automation` アプリの全てのテストスイートを実行し、リグレッションが発生していないことを確認する。
-   [ ] このタスクリストの全ての項目が完了したことを確認する。
