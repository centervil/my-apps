# トラブルシューティングガイド

このガイドでは、セキュリティニュースエージェントを使用する際の一般的な問題とその解決策について説明します。

## 目次

- [設定の問題](#設定の問題)
- [API関連の問題](#api関連の問題)
- [インストールの問題](#インストールの問題)
- [実行時エラー](#実行時エラー)
- [出力の問題](#出力の問題)
- [パフォーマンスの問題](#パフォーマンスの問題)
- [テストの問題](#テストの問題)

## 設定の問題

### APIキーが見つからない

**問題**: `ConfigurationError: Missing required environment variables`

**解決策**:
1. 必要なAPIキーがすべて設定されていることを確認：
   ```bash
   export GOOGLE_API_KEY="your-google-api-key"
   export LANGCHAIN_API_KEY="your-langchain-api-key"
   export TAVILY_API_KEY="your-tavily-api-key"
   ```

2. または`.env`ファイルを作成：
   ```bash
   cp .env.example .env
   # .envファイルを実際のAPIキーで編集
   ```

3. 設定を検証：
   ```bash
   poetry run python -m security_news_agent --validate-only
   ```

### 無効な設定値

**問題**: `ConfigurationError: Invalid SLIDE_FORMAT 'invalid'`

**解決策**: 有効な形式値を使用：
- `pdf` - PDF出力
- `png` - PNG画像
- `html` - HTMLプレゼンテーション
- `` (空) - Markdownのみ

### 環境変数が読み込まれない

**問題**: 設定が正しく見えるがエラーが発生する

**解決策**:
1. `.env`ファイルが正しいディレクトリにあるか確認：
   ```bash
   ls -la .env  # apps/security-news-agent/にあるべき
   ```

2. ファイル形式を確認（`=`の周りにスペースなし）：
   ```bash
   GOOGLE_API_KEY=your-key-here
   # 間違い: GOOGLE_API_KEY = your-key-here
   ```

3. カスタム設定ファイルには絶対パスを使用：
   ```bash
   poetry run python -m security_news_agent --config-file /path/to/.env
   ```

## API関連の問題

### レート制限

**問題**: `TavilyError: Tavily API rate limit exceeded`

**解決策**:
1. テストモードを使用してAPI呼び出しを削減：
   ```bash
   poetry run python -m security_news_agent --test-mode
   ```

2. 再試行前に待機（レート制限は通常1時間でリセット）

3. 各ダッシュボードでAPIクォータを確認

### API認証エラー

**問題**: `TavilyAPIError: Invalid API key`など

**解決策**:
1. APIキーが正しく有効であることを確認
2. キーに必要な権限があるか確認
3. 個別APIをテスト：
   ```bash
   python scripts/test_with_real_apis.py --type quick
   ```

### ネットワークタイムアウト

**問題**: `TavilyNetworkError: Request timeout`

**解決策**:
1. インターネット接続を確認
2. 後で再試行（一時的なAPI問題の可能性）
3. テストモードでタイムアウトを増加：
   ```python
   # コード内: TavilyClient(api_key, timeout=120)
   ```

### Google Geminiエラー

**問題**: `APIError: Google API error`

**解決策**:
1. Google APIキーがGemini API用であることを確認
2. Google Cloud ConsoleでGemini APIが有効になっているか確認
3. 十分なクォータがあることを確認
4. 別のモデルを試す：
   ```bash
   export GEMINI_MODEL_NAME="gemini-1.5-pro"
   ```

## インストールの問題

### Poetryが見つからない

**問題**: `Command 'poetry' not found`

**解決策**:
1. Poetryをインストール：
   ```bash
   curl -sSL https://install.python-poetry.org | python3 -
   ```

2. PATHに追加：
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   ```

3. またはpipを使用：
   ```bash
   pip install -r requirements.txt  # 利用可能な場合
   ```

### Pythonバージョンの問題

**問題**: `Python 3.9+ required`

**解決策**:
1. Pythonバージョンを確認：
   ```bash
   python --version
   ```

2. pyenvを使用してPython 3.9+をインストール：
   ```bash
   pyenv install 3.11.0
   pyenv local 3.11.0
   ```

3. またはシステムパッケージマネージャーを使用：
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install python3.11
   ```

### 依存関係インストールの失敗

**問題**: `poetry install`が失敗する

**解決策**:
1. Poetryキャッシュをクリア：
   ```bash
   poetry cache clear pypi --all
   ```

2. Poetryを更新：
   ```bash
   poetry self update
   ```

3. 詳細出力で試行：
   ```bash
   poetry install -vvv
   ```

## 実行時エラー

### ワークフロー実行の失敗

**問題**: `ProcessingError: Workflow execution failed`

**解決策**:
1. デバッグログを有効化：
   ```bash
   poetry run python -m security_news_agent --log-level DEBUG
   ```

2. 個別コンポーネントを確認：
   ```bash
   poetry run python -m security_news_agent --validate-only
   ```

3. デバッグ用にテストモードを使用：
   ```bash
   poetry run python -m security_news_agent --test-mode --log-level DEBUG
   ```

### メモリの問題

**問題**: `MemoryError`またはシステムが応答しなくなる

**解決策**:
1. テストモードを使用してコンテンツサイズを削減
2. 他のアプリケーションを閉じる
3. システムスワップ領域を増加
4. より多くのRAMを持つマシンを使用

### インポートエラー

**問題**: `ModuleNotFoundError: No module named 'security_news_agent'`

**解決策**:
1. 正しいディレクトリにいることを確認：
   ```bash
   cd apps/security-news-agent
   ```

2. Poetry環境をアクティベート：
   ```bash
   poetry shell
   python -m security_news_agent
   ```

3. またはPoetry runを使用：
   ```bash
   poetry run python -m security_news_agent
   ```

## 出力の問題

### 出力が生成されない

**問題**: エージェントは実行されるがファイルが作成されない

**解決策**:
1. 出力ディレクトリの権限を確認：
   ```bash
   ls -la slides/
   chmod 755 slides/
   ```

2. ワークフローが正常に完了したことを確認：
   ```bash
   poetry run python -m security_news_agent --log-level INFO
   ```

3. ログでエラーを確認

### Marpレンダリングの失敗

**問題**: `MarpNotFoundError: Marp CLI not found`

**解決策**:
1. Marp CLIをインストール：
   ```bash
   npm install -g @marp-team/marp-cli
   ```

2. またはMarkdownのみの出力を使用：
   ```bash
   poetry run python -m security_news_agent --format md
   ```

3. Marpインストールを確認：
   ```bash
   marp --version
   ```

### PDF生成の問題

**問題**: PDFファイルが破損または空

**解決策**:
1. Marp CLIを更新：
   ```bash
   npm update -g @marp-team/marp-cli
   ```

2. 別の形式を試す：
   ```bash
   poetry run python -m security_news_agent --format html
   ```

3. Markdownコンテンツの有効性を確認：
   ```bash
   # 生成された.mdファイルの構文エラーを確認
   ```

### ファイル権限エラー

**問題**: `PermissionError: [Errno 13] Permission denied`

**解決策**:
1. ディレクトリ権限を確認：
   ```bash
   chmod 755 slides/
   ```

2. 適切なユーザー権限で実行
3. 出力ディレクトリを変更：
   ```bash
   poetry run python -m security_news_agent --output-dir ~/reports
   ```

## パフォーマンスの問題

### 実行が遅い

**問題**: エージェントの完了に非常に時間がかかる

**解決策**:
1. より高速な実行のためにテストモードを使用：
   ```bash
   poetry run python -m security_news_agent --test-mode
   ```

2. ネットワーク接続を確認
3. API応答時間を監視
4. 検索クエリの複雑さを削減

### 高いメモリ使用量

**問題**: システムのメモリが不足する

**解決策**:
1. テストモードを使用してコンテンツサイズを削減
2. 他のアプリケーションを閉じる
3. メモリ使用量を監視：
   ```bash
   top -p $(pgrep -f security_news_agent)
   ```

### APIクォータの枯渇

**問題**: API制限に頻繁に到達する

**解決策**:
1. 開発にはテストモードを使用
2. キャッシュを実装（将来の拡張）
3. 実行頻度を削減
4. 必要に応じてAPIプランをアップグレード

## テストの問題

### 単体テストの失敗

**問題**: `pytest`テストが失敗する

**解決策**:
1. テスト依存関係をインストール：
   ```bash
   poetry install --with dev
   ```

2. 特定のテストファイルを実行：
   ```bash
   poetry run pytest tests/unit/test_config.py -v
   ```

3. 不足しているフィクスチャやモックを確認

### 統合テストの失敗

**問題**: 統合テストがモックエラーで失敗する

**解決策**:
1. `tests/fixtures/mock_data.py`のモックデータを更新
2. `conftest.py`のモック設定を確認
3. 詳細出力で実行：
   ```bash
   poetry run pytest tests/integration/ -v -s
   ```

### APIテストの失敗

**問題**: 実APIテストが失敗する

**解決策**:
1. テスト用にAPIキーが設定されていることを確認
2. APIクォータと制限を確認
3. 最小限のテストのみ実行：
   ```bash
   python scripts/test_with_real_apis.py --type quick
   ```

## ヘルプの取得

### デバッグログを有効化

どの問題でも、まずデバッグログから始める：

```bash
poetry run python -m security_news_agent \
  --log-level DEBUG \
  --log-file debug.log \
  --test-mode
```

### システム情報を収集

```bash
# Pythonバージョン
python --version

# Poetryバージョン
poetry --version

# システム情報
uname -a

# 利用可能メモリ
free -h

# ディスク容量
df -h
```

### コンポーネントステータスを確認

```bash
# 設定を検証
poetry run python -m security_news_agent --validate-only

# 個別APIをテスト
python scripts/test_with_real_apis.py --check-keys

# 単体テストを実行
poetry run pytest tests/unit/ -v
```

### イシューレポートを作成

問題を報告する際は以下を含める：

1. **エラーメッセージ**（完全なトレースバック）
2. **使用したコマンド**（機密情報を除く）
3. **環境詳細**（OS、Pythonバージョンなど）
4. **ログ出力**（`--log-level DEBUG`付き）
5. **再現手順**

### 一般的なログパターン

- `ConfigurationError`: 環境変数を確認
- `TavilyError`: APIキーまたはネットワークの問題
- `ProcessingError`: ワークフローまたはコンテンツ生成の問題
- `OutputError`: ファイルシステムまたはレンダリングの問題
- `APIError`: 外部サービスの問題

### 緊急デバッグ

エージェントが完全に壊れている場合：

1. **環境をリセット**：
   ```bash
   rm -rf .venv/
   poetry install
   ```

2. **最小限の設定を使用**：
   ```bash
   poetry run python -m security_news_agent \
     --test-mode \
     --format md \
     --log-level DEBUG
   ```

3. **個別コンポーネントを確認**：
   ```bash
   poetry run python -c "from security_news_agent.config.settings import AgentConfig; print('Config OK')"
   ```

これらの解決策を試した後も問題が続く場合は、上記の詳細情報を含めてGitHubでイシューを作成してください。