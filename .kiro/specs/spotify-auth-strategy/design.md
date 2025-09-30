# Design Document

## Overview

Spotifyのポッドキャスト自動化において、現在のID/パスワードによるログイン方式から認証状態の再利用方式への移行を実現する。この設計では、事前に保存された認証情報（Cookie/ローカルストレージ）を利用してテスト実行時のログイン処理をスキップし、Spotifyによる不正アクティビティ検知を回避する。

## Architecture

### 認証情報管理アーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   手動ログイン   │───▶│  認証情報保存   │───▶│  ファイル保存   │
│   (開発者)      │    │   スクリプト    │    │   (.auth/)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  テスト実行     │◀───│  認証情報読込   │◀───│  ファイル読込   │
│  (自動化)      │    │   ユーティリティ │    │   (.auth/)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### ディレクトリ構造

```
apps/ui-automations/spotify-automation/
├── .auth/                          # 認証情報保存ディレクトリ
│   ├── spotify-auth.json          # 認証状態ファイル
│   └── .gitignore                 # 認証情報をGit管理から除外
├── src/
│   ├── auth/                      # 認証関連ユーティリティ
│   │   ├── authManager.ts         # 認証情報の保存・読込管理
│   │   └── authSetup.ts           # テスト用認証セットアップ
│   └── pages/
│       └── loginPage.ts           # 既存（リファクタリング対象）
├── scripts/
│   └── saveAuth.ts                # 認証情報保存スクリプト
└── tests/
    ├── auth.setup.ts              # 認証セットアップテスト
    ├── login.spec.ts              # リファクタリング対象
    └── newEpisode.spec.ts         # 新認証方式対応
```

## Components and Interfaces

### 1. AuthManager クラス

認証情報の保存と読み込みを管理する中核コンポーネント。

```typescript
interface AuthState {
  cookies: Array<{
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  }>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: number;
  expiresAt?: number;
}

class AuthManager {
  private authFilePath: string;

  async saveAuthState(page: Page): Promise<void>;
  async loadAuthState(context: BrowserContext): Promise<boolean>;
  async isAuthValid(): Promise<boolean>;
  private validateAuthFile(): boolean;
}
```

### 2. AuthSetup ユーティリティ

Playwrightテストでの認証セットアップを簡素化するヘルパー。

```typescript
class AuthSetup {
  static async setupAuthentication(context: BrowserContext): Promise<void>;
  static async requireAuthentication(): Promise<void>;
}
```

### 3. 認証情報保存スクリプト

開発者が手動で認証情報を保存するためのスクリプト。

```typescript
interface SaveAuthOptions {
  headless?: boolean;
  timeout?: number;
  outputPath?: string;
}

async function saveSpotifyAuth(options?: SaveAuthOptions): Promise<void>;
```

## Data Models

### AuthState データモデル

```typescript
interface AuthState {
  // Cookie情報
  cookies: Cookie[];

  // ブラウザストレージ
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;

  // メタデータ
  timestamp: number; // 保存時刻
  expiresAt?: number; // 有効期限（オプション）
  userAgent?: string; // ユーザーエージェント
  viewport?: {
    // ビューポート設定
    width: number;
    height: number;
  };
}

interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
}
```

## Error Handling

### エラー分類と対応

1. **認証ファイル関連エラー**
   - ファイルが存在しない → 初回セットアップガイドを表示
   - ファイルが破損している → 再認証を促す
   - 読み込み権限がない → 権限エラーを表示

2. **認証状態エラー**
   - 認証が期限切れ → 再認証を促す
   - 認証が無効 → 新しい認証情報の保存を促す
   - セッションが無効 → ログアウト状態として処理

3. **ネットワーク・ブラウザエラー**
   - ブラウザコンテキスト作成失敗 → リトライ機構
   - Cookie設定失敗 → 個別Cookie検証
   - ページ読み込み失敗 → タイムアウト調整

### エラーハンドリング戦略

```typescript
class AuthError extends Error {
  constructor(
    message: string,
    public code:
      | 'FILE_NOT_FOUND'
      | 'INVALID_AUTH'
      | 'EXPIRED_AUTH'
      | 'NETWORK_ERROR',
    public recoverable: boolean = true,
  ) {
    super(message);
  }
}

class ErrorHandler {
  static async handleAuthError(error: AuthError): Promise<void> {
    switch (error.code) {
      case 'FILE_NOT_FOUND':
        console.log(
          '認証ファイルが見つかりません。scripts/saveAuth.ts を実行してください。',
        );
        break;
      case 'EXPIRED_AUTH':
        console.log('認証が期限切れです。再度認証情報を保存してください。');
        break;
      // その他のエラー処理...
    }
  }
}
```

## Testing Strategy

### テスト階層

1. **Unit Tests**
   - AuthManager の各メソッド
   - AuthSetup ユーティリティ
   - エラーハンドリング

2. **Integration Tests**
   - 認証情報の保存→読み込みフロー
   - ブラウザコンテキストへの認証状態設定
   - 認証状態の検証

3. **E2E Tests**
   - 実際のSpotifyサイトでの認証フロー
   - 認証後の機能テスト（newEpisode等）

### テスト実行戦略

```typescript
// playwright.config.ts での設定例
export default defineConfig({
  // グローバルセットアップで認証状態を確認
  globalSetup: require.resolve('./tests/auth.setup.ts'),

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'authenticated-tests',
      use: {
        // 認証済みコンテキストを使用
        storageState: '.auth/spotify-auth.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\.spec\.ts/,
      testIgnore: /login\.spec\.ts/, // ログインテストは除外
    },
  ],
});
```

### モックとスタブ

- **開発環境**: 実際のSpotify認証を使用
- **CI環境**: モック認証状態を使用
- **テスト環境**: 期限切れ認証のシミュレーション

## Security Considerations

### 認証情報の保護

1. **ファイルシステム保護**
   - `.auth/` ディレクトリを `.gitignore` に追加
   - ファイル権限を適切に設定（600）
   - 機密情報の暗号化（オプション）

2. **認証情報の有効期限管理**
   - タイムスタンプベースの期限チェック
   - 定期的な認証情報の更新促進
   - 古い認証ファイルの自動削除

3. **開発環境での注意事項**
   - 認証情報の共有禁止
   - 個人アカウントの使用推奨
   - ログファイルへの認証情報出力防止

### セキュリティベストプラクティス

```typescript
class SecurityManager {
  // 認証ファイルの権限チェック
  static async validateFilePermissions(filePath: string): Promise<boolean>;

  // 機密情報のマスキング
  static maskSensitiveData(data: any): any;

  // 認証情報の有効期限チェック
  static isAuthExpired(
    timestamp: number,
    maxAge: number = 24 * 60 * 60 * 1000,
  ): boolean;
}
```

## Migration Plan

### 段階的移行戦略

1. **Phase 1: 基盤構築**
   - AuthManager クラスの実装
   - 認証情報保存スクリプトの作成
   - 基本的なエラーハンドリング

2. **Phase 2: テスト統合**
   - 既存テストの新認証方式への移行
   - Playwright設定の更新
   - CI/CD パイプラインの調整

3. **Phase 3: 最適化**
   - パフォーマンスの最適化
   - エラーハンドリングの改善
   - ドキュメントの整備

### 既存コードへの影響

- `login.spec.ts`: 認証テストから認証検証テストへ変更
- `newEpisode.spec.ts`: ログイン処理の削除、認証済み前提での実装
- `playwright.config.ts`: 認証状態の設定追加
- 新規ファイル: 認証管理関連のユーティリティとスクリプト
