# 設計書 (design.md)

## 1. 概要

本ドキュメントは、Issue #93 の要件を実現するための技術的な設計を定義する。
`scripts/upload.ts` スクリプトを修正し、コマンドライン引数でエピソードのタイトルと説明を受け取り、アップロード処理に渡す仕組みを実装する。

## 2. アーキテクチャ

- **コマンドライン引数解析**: 新たな依存関係は追加せず、Node.js の標準機能である `process.argv` を利用して、`--title` と `--description` 引数を手動で解析する。これにより、プロジェクトの軽量性を維持する。
- **`scripts/upload.ts`**: スクリプトの主たるエントリーポイント。`process.argv` を用いて引数を解析し、必須項目の検証を行う。検証後、`runSpotifyUpload` 関数を呼び出す際に、引数として取得した値を渡す。
- **`apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts`**: Playwright を用いた実際のアップロード処理を担当するモジュール。`runSpotifyUpload` 関数を修正し、引数として `title` と `description` を受け取るように変更する。ハードコードされた値を、これらの引数で置き換える。

## 3. 実装方針

1.  **`spotifyUploader.ts` の修正:**
    -   `runSpotifyUpload` 関数のシグネチャを `async function runSpotifyUpload(title: string, description: string)` のように変更する。
    -   関数内でエピソードのタイトルと説明を入力している部分を、引数 `title` と `description` を使用するように書き換える。

2.  **`scripts/upload.ts` の修正:**
    -   スクリプトの冒頭で `process.argv` を解析し、`--title` と `--description` の値を取得するロジックを実装する。
    -   取得した `title` と `description` が `undefined` または空文字列でないことを確認する。もし無効な場合は、`console.error` でエラーメッセージを表示し、`process.exit(1)` でスクリプトを終了させる。
    -   `runSpotifyUpload` 関数の呼び出し部分を `await runSpotifyUpload(title, description)` のように修正する。

## 4. テスト戦略

-   **手動テスト (E2E):**
    1.  引数を正常に指定した場合: `pnpm exec ts-node scripts/upload.ts --title "テストタイトル" --description "テスト説明"` を実行し、Spotify for Podcasters 上でエピソードが正しく作成されることを確認する。
    2.  引数が不足している場合: `pnpm exec ts-node scripts/upload.ts --title "テストタイトル"` を実行し、エラーメッセージが表示されスクリプトが終了することを確認する。
-   **自動テスト:**
    -   本件は CLI の引数と E2E 操作が中心であり、既存の Playwright テスト構造内でユニットテストを記述するのは費用対効果が低いと判断。手動テストと、CI/CD パイプライン上でのリンティングおよび型チェックに重点を置く。
