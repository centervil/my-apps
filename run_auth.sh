#!/bin/bash
# 実行ディレクトリ（リポジトリルート）を取得
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# ランナー環境（my-appsフォルダ内）か、開発環境（workspace直下）かを判別
if [[ "$REPO_ROOT" == *"/my-apps" ]]; then
    # ランナー環境: 1つ上が workspace
    CREDENTIALS_DIR="$(dirname "$REPO_ROOT")/credentials"
else
    # 開発環境: ルート直下に credentials
    CREDENTIALS_DIR="$REPO_ROOT/credentials"
fi

mkdir -p "$CREDENTIALS_DIR"
export SPOTIFY_AUTH_PATH="$CREDENTIALS_DIR/spotify-auth.json"

echo "Using auth path: $SPOTIFY_AUTH_PATH"
pnpm --filter @my-apps/spotify-automation exec ts-node scripts/saveAuth.ts