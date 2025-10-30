#!/bin/bash

# スクリプトのディレクトリに移動して実行
cd "$(dirname "$0")/.."

# ts-nodeコマンドを実行
npx ts-node --require tsconfig-paths/register src/features/spotifyUploader.ts "$@"
