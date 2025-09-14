# セキュリティニュースエージェント

最新のサイバーセキュリティニュースを自動収集し、プレゼンテーション形式で包括的なレポートを生成するAI搭載エージェントです。LangGraphワークフロー、コンテンツ生成用のGoogle Gemini、ニュース検索用のTavilyを使用しています。

## 機能

- 🔍 **自動ニュース収集**: 複数の信頼できるセキュリティニュースソースを検索
- 🤖 **AI搭載分析**: Google Geminiを使用して調査結果を分析・要約
- 📊 **プロフェッショナルレポート**: Marp対応のスライドプレゼンテーションを生成
- 🔄 **品質保証**: 高品質な出力のための組み込み評価・再試行ロジック
- 📈 **複数フォーマット**: Markdown、PDF、PNG、HTML出力をサポート
- 🧪 **包括的テスト**: 単体テスト、統合テスト、実APIテスト
- 📝 **構造化ログ**: 複数出力形式での詳細ログ
- ⚡ **モジュラーアーキテクチャ**: クリーンで保守可能、拡張可能なコードベース

## クイックスタート

### 前提条件

- Python 3.9以上
- 依存関係管理用のPoetry
- Google Gemini、LangChain、TavilyのAPIキー
- Marp CLI（オプション、Markdown以外の出力形式用）

### インストール

1. **プロジェクトに移動:**
   ```bash
   cd apps/security-news-agent
   ```

2. **依存関係をインストール:**
   ```bash
   poetry install
   ```

3. **環境変数を設定:**
   ```bash
   cp .env.example .env
   # .envファイルをAPIキーで編集（設定セクションを参照）
   ```

4. **設定を検証:**
   ```bash
   poetry run python -m security_news_agent --validate-only
   ```

5. **エージェントを実行:**
   ```bash
   poetry run python -m security_news_agent
   ```

## 設定

### 必須環境変数

| 変数 | 説明 | 必須 |
|------|------|------|
| `GOOGLE_API_KEY` | Google Gemini APIキー | ✅ |
| `LANGCHAIN_API_KEY` | トレース用LangChain APIキー | ✅ |
| `TAVILY_API_KEY` | Tavily検索APIキー | ✅ |

### オプション環境変数

| 変数 | デフォルト | 説明 |
|------|------------|------|
| `GEMINI_MODEL_NAME` | `gemini-1.5-flash-latest` | 使用するGeminiモデル |
| `SLIDE_FORMAT` | `pdf` | 出力形式: `pdf`、`png`、`html`、またはMarkdownのみの場合は空 |
| `MARP_THEME` | `default` | プレゼンテーション用Marpテーマ |
| `MARP_PAGINATE` | `true` | スライドページネーションを有効化 |
| `LANGCHAIN_TRACING_V2` | `true` | LangChainトレースを有効化 |
| `LANGCHAIN_ENDPOINT` | `https://api.smith.langchain.com` | LangChainトレースエンドポイント |
| `LANGCHAIN_PROJECT` | `security-news-agent` | LangChainプロジェクト名 |

### APIキーの取得

1. **Google Gemini API**: [Google AI Studio](https://makersuite.google.com/app/apikey)にアクセス
2. **LangChain API**: [LangSmith](https://smith.langchain.com/)でサインアップ
3. **Tavily API**: [Tavily](https://tavily.com/)で登録

## 使用方法

### 基本的な使用方法

```bash
# 日次セキュリティブリーフィングを生成
poetry run python -m security_news_agent

# カスタムトピック
poetry run python -m security_news_agent --topic "週次セキュリティレビュー"

# 出力ディレクトリと形式を指定
poetry run python -m security_news_agent --output-dir ./reports --format pdf
```

### 高度な使用方法

```bash
# テストモード（API呼び出し制限）
poetry run python -m security_news_agent --test-mode

# 詳細ログ付きデバッグモード
poetry run python -m security_news_agent --log-level DEBUG --log-file debug.log

# 設定検証のみ
poetry run python -m security_news_agent --validate-only

# 古いファイルをクリーンアップ（最新5件を保持）
poetry run python -m security_news_agent --cleanup 5
```

### コマンドラインオプション

| オプション | 説明 |
|------------|------|
| `--topic TEXT` | セキュリティブリーフィングのトピック |
| `--output-dir PATH` | レポートの出力ディレクトリ |
| `--format {pdf,png,html,md}` | 出力形式 |
| `--test-mode` | テスト用の制限されたAPI呼び出しを使用 |
| `--log-level {DEBUG,INFO,WARNING,ERROR}` | ログの詳細レベル |
| `--log-file PATH` | コンソールの代わりにファイルにログ出力 |
| `--config-file PATH` | .env設定ファイルのパス |
| `--validate-only` | 設定の検証のみ |
| `--cleanup N` | 古いファイルをクリーンアップ、最新N件を保持 |

## 開発

### プロジェクト構造

```
src/security_news_agent/
├── __init__.py              # パッケージ初期化
├── __main__.py              # メインエントリーポイント
├── config/
│   ├── __init__.py
│   └── settings.py          # 設定管理
├── search/
│   ├── __init__.py
│   └── tavily_client.py     # Tavily API統合
├── processing/
│   ├── __init__.py
│   ├── workflow.py          # LangGraphワークフロー
│   ├── nodes.py             # 個別ワークフローノード
│   └── state.py             # 状態管理
├── output/
│   ├── __init__.py
│   └── renderer.py          # レポートレンダリング
└── utils/
    ├── __init__.py
    ├── helpers.py           # ユーティリティ関数
    ├── logging_config.py    # ログ設定
    └── error_handling.py    # エラーハンドリングユーティリティ
```

### テストの実行

```bash
# すべてのテストを実行
make test

# 特定のテストタイプを実行
make test-unit           # 単体テストのみ
make test-integration    # 統合テストのみ
make test-coverage       # カバレッジレポート付きテスト

# 実APIでテスト実行（APIキーが必要）
python scripts/test_with_real_apis.py --type minimal
```

### コード品質

```bash
# コードフォーマット
make format

# リンティング実行
make lint

# すべての品質チェック実行
make test-coverage lint
```

### テストスクリプトの使用

```bash
# 包括的テスト実行
python scripts/run_tests.py --all

# 特定のテストタイプ実行
python scripts/run_tests.py --unit
python scripts/run_tests.py --integration
python scripts/run_tests.py --coverage
```

## 出力

エージェントは`slides/`ディレクトリにレポートを生成します：

- **Markdownファイル**: 常に生成、Marp対応形式
- **PDF/PNG/HTML**: Marp CLIがインストールされ、形式が指定されている場合に生成
- **ログ**: 詳細な実行ログ（`--log-file`使用時）

### サンプル出力構造

```
slides/
├── 2025-01-27_Daily_Security_Briefing.md
├── 2025-01-27_Daily_Security_Briefing.pdf
└── ...
```

## トラブルシューティング

一般的な問題と解決策については[トラブルシューティングガイド](TROUBLESHOOTING-ja.md)を参照してください。

## アーキテクチャ

エージェントは以下のコンポーネントを持つモジュラーアーキテクチャを使用しています：

1. **設定モジュール**: 環境変数と設定を管理
2. **検索モジュール**: ニュース収集用のTavily API統合を処理
3. **処理モジュール**: コンテンツ生成と評価用のLangGraphワークフロー
4. **出力モジュール**: Marpレンダリングとファイル操作
5. **ユーティリティモジュール**: ログ、エラーハンドリング、ヘルパー関数

### ワークフローステップ

1. **ニュース収集**: 複数のセキュリティニュースソースを検索
2. **アウトライン生成**: 収集されたニュースから構造化アウトラインを作成
3. **目次**: プレゼンテーション構造を生成
4. **スライド生成**: Marp形式のスライドを作成
5. **品質評価**: 品質を評価し、必要に応じて再試行
6. **出力レンダリング**: Markdownを保存し、他の形式にレンダリング

## 貢献

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更を加える
4. テストを実行: `make test`
5. プルリクエストを送信

## ライセンス

このプロジェクトはMITライセンスの下でライセンスされています。

## サポート

問題や質問については：

1. [トラブルシューティングガイド](TROUBLESHOOTING-ja.md)を確認
2. 既存のGitHubイシューを確認
3. 詳細情報を含む新しいイシューを作成
