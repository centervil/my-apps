# Design - Issue #135: セルフホストランナー用 Dockerfile の作成と環境構築

## アーキテクチャ

### 構成要素
- **ベースイメージ**: Ubuntu 20.04 (開発環境と一致させる)
- **デスクトップ環境**: Fluxbox + TigerVNC + noVNC (ブラウザ経由の操作用)
- **ランタイム**: Node.js 20.x, Python 3.9, pnpm
- **GitHub Runner**: GitHub Actions Runner Agent
- **自動化ツール**: Playwright (必要なシステム依存関係を含む)

### ディレクトリ構造
`my-apps` リポジトリ内に以下のファイルを作成・配置する。
- `apps/infra/self-hosted-runner/Dockerfile` (またはルート直下の適切な場所)
- `apps/infra/self-hosted-runner/entrypoint.sh`

## 実装方針

### 1. Dockerfile の設計
- 現行の `.devcontainer/Dockerfile` をベースにしつつ、開発用ツール（git-secret等）の一部を整理し、ランナーエージェントを追加する。
- `noVNC` を導入し、ポート 6080 等でデスクトップ画面をサーブする。

### 2. 起動フロー (`entrypoint.sh`)
1. **Runner の登録**: 環境変数からトークンを受け取り、GitHub に登録。
2. **コードの取得**: `/home/devuser/actions-runner/workspace` 等に `my-apps` をクローン。
3. **依存関係の解決**: `pnpm install` を実行。
4. **サービスの起動**: VNC サーバー、noVNC、および Runner Agent をバックグラウンドで起動。

### 3. セキュリティ戦略
- ホストディレクトリのマウントを行わず、コンテナ内でのみデータを保持。
- 認証情報はコンテナのライフサイクルに依存させ、再起動時には手動ログインを必須とする。

## テスト戦略

### ユニット/統合テスト
- Docker イメージのビルドが正常に完了することを確認。
- `entrypoint.sh` が正常に終了し、GitHub の Runners 一覧に表示されることを確認。

### 手動検証
- ブラウザから noVNC に接続し、デスクトップが表示されるか。
- ターミナルから `pnpm run test` 等が動作するか。
- Spotify のログインページを開き、入力操作が可能か。
