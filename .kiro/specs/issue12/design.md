# 設計書: Issue #12 - 「新しいエピソード」ページでの音声ファイルアップロード

## 1. 概要

Issue #12で定義された音声ファイルアップロード機能を実装するための技術的な設計を定義する。

## 2. アーキテクチャ

既存のPlaywrightとページオブジェクトモデル（POM）アーキテクチャを踏襲する。

- **テスト (`tests/`)**: ユーザーの操作シナリオを記述する。
- **ページオブジェクト (`src/pages/`)**: UIの構造と操作をカプセル化する。

## 3. 実装方針

### 3.1. ページオブジェクトの変更

`apps/ui-automations/spotify-automation/src/pages/NewEpisodePage.ts` を以下のように変更する。

1.  **ロケーターの追加**: ファイルアップロードのための `<input type="file">` 要素を特定するロケーターを追加する。この要素は通常、ユーザーからは直接見えない場合があるため、Playwright Inspectorやブラウザの開発者ツールを使用して正確に特定する。
2.  **メソッドの追加**: `uploadAudioFile(filePath: string): Promise<void>` という新しいメソッドを実装する。
    - このメソッドは、引数で受け取った `filePath` を使用して、Playwrightの `locator.setInputFiles()` メソッドを呼び出し、ファイル選択ダイアログを介さずに直接ファイルをアップロードする。

### 3.2. テストケースの追加

`apps/ui-automations/spotify-automation/tests/newEpisode.spec.ts` に新しいテストケースを追加する。

1.  **テスト名**: `"should upload an audio file and verify the result"` のような分かりやすい名前を付ける。
2.  **テストの前提条件**: テストの前に、「新しいエピソード」ページに正しく遷移していることを確認する。
3.  **操作**: `NewEpisodePage` の `uploadAudioFile()` メソッドを呼び出し、テスト用の音声ファイルをアップロードする。
4.  **検証**: アップロード後、ファイル名がページに表示される、UIの状態が「アップロード完了」に変わるなど、成功を示す要素や状態を `expect()` を用いて検証する。

### 3.3. テストデータ

- テストに使用するダミーの音声ファイル（例: `test-audio.mp3`）を準備する。
- このファイルは `apps/ui-automations/spotify-automation/tests/fixtures/` のような専用ディレクトリに配置し、テスト実行時に動的にパスを解決して使用する。

## 4. エラーハンドリング

- 指定されたファイルパスが存在しない場合のエラーハンドリングを考慮する。
- アップロード処理がUI上で失敗した場合（例: タイムアウト、予期せぬUIの変更）、テストが明確に失敗し、原因が特定しやすいように適切な待機処理（`waitFor`など）を組み込む。
