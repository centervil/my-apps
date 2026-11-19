#!/usr/bin/env bash
set -e

# OCI ホストの cron から GitHub Actions ワークフローを手動発火させるフォールバック用スクリプト
# 使用方法: ./daily-publish-fallback.sh [YYYY-MM-DD] [true/false for dry_run]

DATE_OVERRIDE="${1:-}"
DRY_RUN="${2:-false}"

echo "Triggering daily-publish workflow on centervil/my-apps..."

REF_ARGS=""
if [ "$DATE_OVERRIDE" != "" ]; then
  REF_ARGS="-f date=$DATE_OVERRIDE -f dry_run=$DRY_RUN"
else
  REF_ARGS="-f dry_run=$DRY_RUN"
fi

gh workflow run daily-publish.yml --repo centervil/my-apps $REF_ARGS

echo "Workflow triggered successfully."
