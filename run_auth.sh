#!/bin/bash
mkdir -p credentials
pnpm --filter @my-apps/spotify-automation exec ts-node scripts/saveAuth.ts