#!/bin/bash

# スクリプトのディレクトリに移動して実行
cd "$(dirname "$0")/.."

# note CLI を実行
npx tsx src/noteCli.ts "$@"
