#!/usr/bin/env bash
# Deploy mswy.xyz to Cloudflare Pages
# Usage:
#   ./scripts/deploy.sh          # Deploy to staging (preview)
#   ./scripts/deploy.sh prod     # Deploy to production

set -euo pipefail

BRANCH="staging"
if [ "${1:-}" = "prod" ]; then
  BRANCH="main"
fi

cd "$(dirname "$0")/.."

echo "Building..."
npm run build

echo "Deploying to Cloudflare Pages (branch: $BRANCH)..."
npx wrangler pages deploy dist \
  --project-name mswy \
  --branch "$BRANCH" \
  --commit-dirty=true

echo "Done."
