#!/bin/bash
set -e

# Issue番号が指定されているか確認
if [ -z "$1" ]; then
  echo "エラー: Issue番号を指定してください。"
  exit 1
fi

ISSUE_NUMBER=$1

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "エラー: mainブランチで実行してください。"
  exit 1
fi

# mainブランチを最新の状態に更新
echo "mainブランチを最新の状態に更新しています..."
git pull origin main


# gh-cliでIssue情報を取得
ISSUE_JSON=$(gh issue view "$ISSUE_NUMBER" --json title,body)
if [ $? -ne 0 ]; then
    echo "エラー: Issue $ISSUE_NUMBER の取得に失敗しました。"
    exit 1
fi

ISSUE_TITLE=$(echo "$ISSUE_JSON" | jq -r .title)
ISSUE_BODY=$(echo "$ISSUE_JSON" | jq -r .body)

# タイトルをケバブケースに変換
KEBAB_TITLE=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed -e 's/[:\/()]/ /g' -e 's/[^a-z0-9]/-/g' -e 's/--\+/-/g' -e 's/^-//' -e 's/-$//')

BRANCH_NAME="feat/$ISSUE_NUMBER-$KEBAB_TITLE"
DOCS_DIR="docs/issues/$ISSUE_NUMBER"

# ブランチ作成とディレクトリ準備
git checkout -b "$BRANCH_NAME"
mkdir -p "$DOCS_DIR"

echo "ブランチ $BRANCH_NAME を作成し、ディレクトリ $DOCS_DIR/ を準備しました。"

# 後続のLLMプロンプトで利用する情報を出力
echo "---"
echo "ISSUE_TITLE_FOR_GENERATION: $ISSUE_TITLE"
echo "---"
echo "ISSUE_BODY_FOR_GENERATION: $ISSUE_BODY"
