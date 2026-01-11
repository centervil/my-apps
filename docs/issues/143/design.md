# Design: 認証ファイル保存パスの不整合修正

## 1. アーキテクチャ (Architecture)

### コンポーネント構成
- **`src/utils/paths.ts` (New)**: 認証ファイルのパス解決ロジックをカプセル化したユーティリティモジュール。
- **`scripts/saveAuth.ts`**: `paths.ts` を利用して保存先を決定する。
- **`src/features/spotifyUploader.ts`**: `paths.ts` を利用して読み込み先を決定する。
- **`playwright.config.ts`**: テスト実行時のストレージステート設定に `paths.ts` (または同等のロジック) を適用する。

### データフロー
1. 各コンポーネントは `getSpotifyAuthPath()` を呼び出す。
2. `getSpotifyAuthPath()` は環境変数を確認し、なければホームディレクトリベースのデフォルトパスを生成する。
3. 書き込みを行うコンポーネント（`saveAuth.ts`）は、取得したパスのディレクトリ存在確認と作成を行う。

## 2. インターフェース設計 (Interface Design)

### `src/utils/paths.ts`

```typescript
/**
 * 認証ファイルの絶対パスを取得します。
 * 環境変数 SPOTIFY_AUTH_PATH が設定されていればそれを返し、
 * なければデフォルトの $HOME/.my-apps/credentials/spotify-auth.json を返します。
 */
export function getSpotifyAuthPath(): string;

/**
 * 指定されたパスのディレクトリが存在することを確認し、なければ作成します。
 * @param filePath ファイルのフルパス
 */
export function ensureAuthDir(filePath: string): void;
```

## 3. 実装詳細 (Implementation Details)

### 3.1. パス解決ロジック
- `os.homedir()` を使用してクロスプラットフォームにホームディレクトリを取得。
- `path.resolve()` を使用して絶対パス化を保証。
- デフォルトパス: `path.join(os.homedir(), '.my-apps', 'credentials', 'spotify-auth.json')`

### 3.2. 既存コードの変更
- `scripts/saveAuth.ts`:
  - 独自のパス計算ロジックを削除。
  - `getSpotifyAuthPath()` と `ensureAuthDir()` を使用。
- `src/features/spotifyUploader.ts`:
  - `getAuthPath` 内部関数を `utils/paths.ts` の利用に置き換え。
  - 既存の「ワークスペースルートの `credentials/` を探す」というフォールバックロジックは、今回の要件（ホームディレクトリ統一）に従い**削除**する。ただし、移行期間として古いパスが存在する場合の考慮が必要か検討するが、今回は「不整合修正」が主眼のため、新しい標準パスへの移行を優先する。
  - *Note*: 既存の `credentials/spotify-auth.json` (repo root) は使用されなくなるため、開発者は一度 `saveAuth` を再実行するか、手動でファイルを移動する必要がある。

## 4. テスト戦略 (Test Strategy)

### 4.1. ユニットテスト (`tests/utils/paths.spec.ts`)
- **ケース1**: `SPOTIFY_AUTH_PATH` が設定されている場合、その値を返すこと。
- **ケース2**: 環境変数が未設定の場合、ホームディレクトリ以下のデフォルトパスを返すこと。
- **ケース3**: `ensureAuthDir` が存在しないディレクトリを再帰的に作成できること。

### 4.2. 結合テスト / E2Eテスト
- 既存の `tests/e2e/cli.spec.ts` などのE2Eテストを実行し、認証エラーが発生しないことを確認する。
- （手動確認）`saveAuth.ts` を実行し、`~/.my-apps/credentials/` にファイルが生成されることを確認。

## 5. エラーハンドリング
- ファイル書き込み権限がない場合 (`EACCES`) など、`fs` 操作時の標準的なエラーはそのままスローし、呼び出し元またはグローバルハンドラでログ出力する。
