# 設計書: `--season` と `--episode` 引数の追加

## 1. 概要

本ドキュメントは、`spotify-automation` ツールにシーズン番号とエピソード番号を指定する機能を追加するための技術設計を定義する。

## 2. アーキテクチャ

変更は `apps/ui-automations/spotify-automation` プロジェクト内に限定される。主に以下のファイルが変更対象となる。

-   `apps/ui-automations/spotify-automation/src/upload.ts`: コマンドライン引数を解釈し、Uploaderに渡す役割。
-   `apps/ui-automations/spotify-automation/src/lib/spotifyUploader.ts`: 実際にブラウザを操作し、値を入力する役割。
-   `apps/ui-automations/spotify-automation/README.md`: ツールの使用方法を記述したドキュメント。

## 3. 実装方針

### 3.1. `upload.ts` の変更

1.  **引数解析**:
    -   既存の引数パーサー（`yargs`を想定）を利用して、`--season` と `--episode` オプションを追加する。
    -   これらのオプションは数値（`number`）型として定義する。
2.  **値の伝達**:
    -   パースした `season` と `episode` の値を `SpotifyUploader` クラスのインスタンスに渡す。引数が指定されていない場合は `undefined` を渡す。

### 3.2. `spotifyUploader.ts` の変更

1.  **パラメータの受け入れ**:
    -   `SpotifyUploader` クラスのコンストラクタ、またはアップロードを実行するメソッド（例: `uploadEpisode`）を更新し、`seasonNumber?: number` と `episodeNumber?: number` をオプションの引数として受け入れるように変更する。
2.  **UI操作**:
    -   シーズン番号とエピソード番号の入力フィールドに対応するPlaywrightのロケーターを特定する。
    -   `seasonNumber` が指定されている場合、シーズン番号フィールドにその値を入力する。
    -   `episodeNumber` が指定されている場合、エピソード番号フィールドにその値を入力する。
    -   これらの処理は、引数が `undefined` でない場合にのみ実行する条件分岐を追加する。これにより、既存のハードコードされたロジックを安全に置き換える。

### 3.3. `README.md` の更新

-   `spotify-automation` の `README.md` ファイルを編集し、「Usage」セクションに `--season` と `--episode` 引数の説明と使用例を追加する。

## 4. エラーハンドリング

-   `yargs` の型定義により、数値以外の値が指定された場合は自動的にエラーとなる。
-   引数が指定されない場合は、`undefined` として扱われ、UI操作がスキップされるため、後方互換性が維持される。

## 5. テスト戦略

-   **手動テスト**:
    1.  `--season` と `--episode` 引数を指定して `upload` スクリプトを実行し、ブラウザ上で正しい値が入力されることを目視で確認する。
    2.  引数を指定せずにスクリプトを実行し、シーズン番号とエピソード番号のフィールドが無視され、処理が正常に完了することを確認する。
-   **自動テスト**:
    -   本件はUI操作の変更が主であるため、新規の単体テストは作成しない。既存のE2Eテストがあれば、それに準ずる。
