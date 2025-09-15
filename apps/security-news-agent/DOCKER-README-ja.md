# Docker環境でのセキュリティニュースエージェント

このガイドでは、Dockerを使用してセキュリティニュースエージェントを実行する方法を説明します。

## 前提条件

- Docker
- Docker Compose
- APIキー（Google Gemini、LangChain、Tavily）

## クイックスタート

### 1. 環境変数の設定

```bash
# 設定例ファイルをコピー
cp .env.docker.example .env

# .envファイルを編集してAPIキーを設定
nano .env
```

### 2. Dockerイメージのビルド

```bash
# テストスクリプトを使用
./scripts/docker_test.sh build

# または直接docker-composeを使用
docker-compose build
```

### 3. 設定の検証

```bash
# 設定が正しいかテスト
./scripts/docker_test.sh validate
```

### 4. アプリケーションの実行

```bash
# テストモード（API使用量制限）
./scripts/docker_test.sh test-mode

# フルモード（実際のレポート生成）
./scripts/docker_test.sh full
```

## 利用可能なコマンド

### テストスクリプト使用

```bash
# すべてのテストを実行
./scripts/docker_test.sh all

# 個別テスト
./scripts/docker_test.sh validate      # 設定検証
./scripts/docker_test.sh unittest      # 単体テスト
./scripts/docker_test.sh integration   # 統合テスト
./scripts/docker_test.sh test-mode     # テストモード実行
./scripts/docker_test.sh full          # フルモード実行

# クリーンアップ
./scripts/docker_test.sh clean
```

### Docker Compose直接使用

```bash
# 設定検証
docker-compose run --rm security-news-agent-validate

# 単体テスト
docker-compose run --rm security-news-agent-unittest

# 統合テスト
docker-compose run --rm security-news-agent-integration

# テストモード実行
docker-compose run --rm security-news-agent-test

# フルモード実行
docker-compose run --rm security-news-agent

# カスタムコマンド実行
docker-compose run --rm security-news-agent poetry run python -m security_news_agent --help
```

## ファイル構造

```
apps/security-news-agent/
├── Dockerfile                 # Dockerイメージ定義
├── docker-compose.yml         # Docker Compose設定
├── .dockerignore              # Docker除外ファイル
├── .env.docker.example        # 環境変数設定例
├── scripts/
│   └── docker_test.sh         # テスト実行スクリプト
├── slides/                    # 出力ファイル（ホストにマウント）
└── logs/                      # ログファイル（ホストにマウント）
```

## 環境変数

### 必須変数

| 変数名 | 説明 |
|--------|------|
| `GOOGLE_API_KEY` | Google Gemini APIキー |
| `LANGCHAIN_API_KEY` | LangChain APIキー |
| `TAVILY_API_KEY` | Tavily検索APIキー |

### オプション変数

| 変数名 | デフォルト | 説明 |
|--------|------------|------|
| `GEMINI_MODEL_NAME` | `gemini-1.5-flash-latest` | 使用するGeminiモデル |
| `SLIDE_FORMAT` | `pdf` | 出力形式 |
| `MARP_THEME` | `default` | Marpテーマ |
| `LANGCHAIN_PROJECT` | `security-news-agent-docker` | LangChainプロジェクト名 |

## 出力ファイル

生成されたファイルは以下のディレクトリに保存されます：

- `./slides/` - 生成されたレポート（Markdown、PDF等）
- `./logs/` - 実行ログ

## トラブルシューティング

### よくある問題

1. **APIキーエラー**
   ```bash
   # 設定を確認
   cat .env
   
   # 設定検証を実行
   ./scripts/docker_test.sh validate
   ```

2. **権限エラー**
   ```bash
   # スクリプトに実行権限を付与
   chmod +x scripts/docker_test.sh
   ```

3. **Docker容量不足**
   ```bash
   # 未使用リソースをクリーンアップ
   ./scripts/docker_test.sh clean
   
   # システム全体のクリーンアップ
   docker system prune -a
   ```

4. **ポート競合**
   ```bash
   # 実行中のコンテナを確認
   docker ps
   
   # 停止
   docker-compose down
   ```

### ログの確認

```bash
# コンテナのログを確認
docker-compose logs security-news-agent

# リアルタイムでログを監視
docker-compose logs -f security-news-agent-test

# ホストのログファイルを確認
ls -la logs/
```

### デバッグモード

```bash
# デバッグログ付きで実行
docker-compose run --rm -e LOG_LEVEL=DEBUG security-news-agent-test

# コンテナ内でシェルを起動
docker-compose run --rm --entrypoint /bin/bash security-news-agent
```

## パフォーマンス最適化

### イメージサイズの最適化

```bash
# マルチステージビルドの使用（将来の改善）
# 現在のイメージサイズを確認
docker images | grep security-news-agent
```

### キャッシュの活用

```bash
# 依存関係のキャッシュを活用してビルド時間を短縮
docker-compose build --parallel
```

## セキュリティ考慮事項

1. **APIキーの管理**
   - `.env`ファイルをバージョン管理に含めない
   - 本番環境では環境変数またはシークレット管理システムを使用

2. **ネットワークセキュリティ**
   - 必要に応じてネットワーク制限を設定
   - プロキシ環境での使用時は適切な設定を行う

3. **ファイル権限**
   - 出力ファイルの権限を適切に設定
   - 機密情報を含むログファイルの取り扱いに注意

## 本番環境での使用

本番環境でDockerを使用する場合の推奨事項：

1. **環境変数の管理**
   ```bash
   # Docker Secretsまたは外部シークレット管理を使用
   docker secret create google_api_key /path/to/google_api_key.txt
   ```

2. **ログ管理**
   ```bash
   # ログドライバーの設定
   docker-compose.override.yml で logging 設定を追加
   ```

3. **監視**
   ```bash
   # ヘルスチェックの活用
   docker-compose ps
   ```

4. **自動化**
   ```bash
   # cron等でスケジュール実行
   0 1 * * * cd /path/to/security-news-agent && ./scripts/docker_test.sh test-mode
   ```

## サポート

問題が発生した場合：

1. [TROUBLESHOOTING-ja.md](TROUBLESHOOTING-ja.md)を確認
2. ログファイルを確認
3. GitHubでイシューを作成（ログとコマンドを含める）