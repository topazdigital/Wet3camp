#!/usr/bin/env bash
# deploy.sh — One-line deploy for Wet3Camp to DirectAdmin server
# Usage: ./deploy.sh
# Requires: ssh key configured for admin@157.250.205.180

set -euo pipefail

SERVER="admin@157.250.205.180"
REMOTE_PATH="/home/admin/domains/wet3.camp/public_html"
API_PATH="/home/admin/wet3camp-api"
APP="wet3camp-api"

echo "▶ Building frontend..."
pnpm --filter @workspace/wet3camp run build

echo "▶ Syncing frontend dist to server..."
rsync -az --delete artifacts/wet3camp/dist/ "${SERVER}:${REMOTE_PATH}/"

echo "▶ Syncing API server to server..."
rsync -az --delete \
  --exclude='node_modules' \
  --exclude='.env' \
  --exclude='dist' \
  artifacts/api-server/ "${SERVER}:${API_PATH}/"

echo "▶ Installing API deps & rebuilding on server..."
ssh "${SERVER}" "cd ${API_PATH} && npm install --production && npm run build 2>/dev/null || true"

echo "▶ Restarting API via PM2..."
ssh "${SERVER}" "cd ${API_PATH} && (pm2 reload ${APP} 2>/dev/null || pm2 start dist/index.js --name ${APP} --env production)"

echo "▶ Saving PM2 process list..."
ssh "${SERVER}" "pm2 save"

echo ""
echo "✅ Deploy complete → https://wet3.camp"
