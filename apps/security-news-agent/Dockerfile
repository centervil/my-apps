# セキュリティニュースエージェント用Dockerfile
FROM python:3.11-slim

# 作業ディレクトリを設定
WORKDIR /app

# システムの依存関係をインストール
RUN apt-get update && apt-get install -y \
    curl \
    git \
    nodejs \
    npm \
    && rm -rf /var/lib/apt/lists/*

# Marp CLIをインストール（PDF生成用）
RUN npm install -g @marp-team/marp-cli

# Poetryをインストール
RUN pip install poetry

# Poetry設定（仮想環境をプロジェクト内に作成）
RUN poetry config virtualenvs.create true
RUN poetry config virtualenvs.in-project true

# プロジェクトファイルをコピー
COPY pyproject.toml poetry.lock* ./

# 依存関係のみをインストール（プロジェクト自体はインストールしない）
RUN poetry lock
RUN poetry install --no-interaction --no-ansi --no-root

# アプリケーションコードをコピー
COPY . .

# プロジェクトをインストール（lockファイルを再生成）
RUN poetry lock
RUN poetry install --no-interaction --no-ansi

# 出力ディレクトリを作成
RUN mkdir -p slides logs

# 権限を設定
RUN chmod +x scripts/*.py

# ヘルスチェック用のスクリプトを作成
RUN echo '#!/bin/bash\npoetry run python -m security_news_agent --validate-only' > /healthcheck.sh
RUN chmod +x /healthcheck.sh

# ヘルスチェックを設定
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# デフォルトコマンド
CMD ["poetry", "run", "python", "-m", "security_news_agent", "--help"]