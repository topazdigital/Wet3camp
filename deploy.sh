#!/usr/bin/env bash
# ============================================================
#  deploy.sh — Run this FROM REPLIT (not from the server)
#
#  What it does:
#    1. Builds the React frontend
#    2. Rsyncs the built files to the server web root
#    3. Rsyncs the API server source to the server
#    4. Installs deps + rebuilds the API on the server
#    5. Restarts the API via PM2
#
#  Requirements:
#    - Your SSH public key must be in ~/.ssh/authorized_keys on the server
#    - rsync must be available (it is on Replit)
#    - PM2 must be installed on the server: npm i -g pm2
#
#  Usage (from Replit shell):
#    chmod +x deploy.sh && ./deploy.sh
# ============================================================

set -euo pipefail

SERVER="root@157.250.205.180"
WEB_ROOT="/home/admin/domains/wet3.camp/public_html"
API_DIR="/home/admin/wet3camp-api"
PM2_APP="wet3camp-api"

echo "▶ [1/5] Building frontend..."
pnpm --filter @workspace/wet3camp run build

echo "▶ [2/5] Uploading frontend to server..."
rsync -az --delete artifacts/wet3camp/dist/ "${SERVER}:${WEB_ROOT}/"

echo "▶ [3/5] Uploading API server source..."
rsync -az --delete \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.env' \
  artifacts/api-server/ "${SERVER}:${API_DIR}/"

echo "▶ [4/5] Installing & building API on server..."
ssh "${SERVER}" "cd ${API_DIR} && npm install --omit=dev && npm run build 2>/dev/null || npx tsc --skipLibCheck 2>/dev/null || true"

echo "▶ [5/5] Restarting API via PM2..."
ssh "${SERVER}" "cd ${API_DIR} && (pm2 reload ${PM2_APP} --update-env 2>/dev/null || pm2 start dist/index.js --name ${PM2_APP} --env production) && pm2 save"

echo ""
echo "✅  Deployed → https://wet3.camp"
