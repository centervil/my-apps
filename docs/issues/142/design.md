# 技術設計書 (design.md) - Issue #142

## アーキテクチャ
現在の `src/cli.ts` の手続き的な引数処理を、`yargs` の宣言的な API を使用した構造に移行する。

## 実装方針

### 1. 引数定義の刷新
`yargs` のメソッドチェーンを使用して、以下のように引数を定義する。
- `.option('showId', { alias: 's', type: 'string', demandOption: true, description: 'Spotify Show ID' })`
- 他の引数も同様に定義。

### 2. 設定ファイルとのマージ
設定ファイル (`--config`) からの読み込みとコマンドライン引数のマージロジックを整理する。`yargs` の `.config()` 機能を活用するか、現在のマージロジックをよりクリーンな形で維持する。

### 3. バリデーション
- 必須チェックは `demandOption` に任せる。
- ファイルパスの存在チェックなど、より複雑なバリデーションが必要な場合は `.check()` メソッドを検討する。ただし、既存の `findLatestFile` ロジックとの兼ね合いを考慮する。

### 4. 型定義
解析された引数の型を `SpotifyUploadOptions` と一致させることで、後続の `runSpotifyUpload` 呼び出し時の型安全性を向上させる。

## テスト戦略
- **単体テスト**: 必要に応じて `cli.ts` から分離されたユーティリティ関数のテストを追加する。
- **E2Eテスト**: 既存の `apps/ui-automations/spotify-automation/tests/e2e/cli.spec.ts` を実行し、リファクタリング後もエラーメッセージや正常系動作が変わらないことを確認する。
