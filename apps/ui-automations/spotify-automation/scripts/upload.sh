#!/bin/bash

# スクリプトのディレクトリに移動して実行
cd "$(dirname "$0")/.."

# tsxコマンドを実行
npx tsx src/cli.ts "$@"
