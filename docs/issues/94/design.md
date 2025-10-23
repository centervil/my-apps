# 設計書 (design.md)

## 1. 概要

本ドキュメントは、Issue #94 の要件に基づき、Spotifyアップロードスクリプト (`spotifyUploader.ts`) のCI環境への対応を目的とした技術的な設計を定義します。

## 2. アーキテクチャ

本改修は既存のアーキテクチャに大きな変更を加えません。変更は `apps/ui-automations/spotify-automation/src/features/spotifyUploader.ts` ファイル内に限定されます。

## 3. 実装方針

### 3.1. Playwrightのヘッドレスモード有効化

`spotifyUploader.ts` 内の `playwright.chromium.launch()` メソッドの呼び出し箇所を特定し、`launch` オプションを以下のように変更します。

- **変更前:** `headless: false`
- **変更後:** `headless: true`

これにより、スクリプトはGUIのない環境でも実行可能になります。

### 3.2. 認証パスの動的な解決

認証ファイルのパス解決ロジックをリファクタリングし、環境の柔軟性を高めます。

1.  **環境変数の導入**:
    - 認証ファイルのパスを格納する環境変数として `SPOTIFY_AUTH_PATH` を利用します。

2.  **パス解決ロジック**:
    - スクリプト実行時、まず `process.env.SPOTIFY_AUTH_PATH` から値の取得を試みます。
    - 環境変数が設定されている場合、そのパスを利用します。
    - 環境変数が設定されていない場合（ローカル開発環境など）、従来通りハードコードされたデフォルトのパス（例: `../../../.auth/spotify`）をフォールバックとして利用します。

```typescript
// 実装イメージ
import path from 'path';

// ...

const getAuthPath = (): string => {
  const fromEnv = process.env.SPOTIFY_AUTH_PATH;
  if (fromEnv) {
    return fromEnv;
  }
  // 環境変数が未設定の場合のフォールバックパス
  return path.resolve(__dirname, '../../../.auth/spotify');
};

const storageState = getAuthPath();

// ...

const browser = await playwright.chromium.launch({
  headless: true, // ヘッドレスモードを有効化
});

const context = await browser.newContext({
  storageState, // 動的に取得したパスを利用
});
```

## 4. テスト戦略

- **単体テスト**:
  - `getAuthPath` 関数のロジックを検証する単体テストを追加します。
    - 環境変数が設定されている場合に正しいパスを返すか。
    - 環境変数が設定されていない場合にデフォルトパスを返すか。

- **手動テスト（ローカル）**:
  - 変更後、ローカル環境で `pnpm exec ts-node src/features/spotifyUploader.ts` などを実行し、従来通りの動作を確認します。

- **CI/CDパイプラインでの検証**:
  - GitHub Actionsのワークフロー (`.github/workflows/ci.yml` など) を更新し、`spotify-automation` のテストステップで `SPOTIFY_AUTH_PATH` 環境変数を設定します。
  - プルリクエスト作成時にCIが正常に完了することをもって、CI環境での動作を検証します。
