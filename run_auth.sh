#!/bin/bash
# リポジトリルートから見て1つ上のディレクトリに credentials を作成する
mkdir -p ../credentials
pnpm --filter @my-apps/spotify-automation exec ts-node scripts/saveAuth.ts
