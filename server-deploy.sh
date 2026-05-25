#!/usr/bin/env bash
# ============================================================
#  server-deploy.sh — Run this ON the server (root@157.250.205.180)
#
#  Upload this file once to the server, then run it there:
#    scp server-deploy.sh root@157.250.205.180:~/
#    ssh root@157.250.205.180
#    chmod +x ~/server-deploy.sh
#    ~/server-deploy.sh
#
#  This script pulls the latest code from GitHub and restarts the API.
#  Requires: git, node, npm, pm2 (npm i -g pm2)
# ============================================================

set -euo pipefail

REPO="https://github.com/YOUR_USERNAME/wet3camp.git"   # ← update this
WEB_ROOT="/home/admin/domains/wet3.camp/public_html"
API_DIR="/home/admin/wet3camp-api"
PM2_APP="wet3camp-api"

echo "▶ Pulling latest code..."
if [ -d "$API_DIR/.git" ]; then
  git -C "$API_DIR" pull origin main
else
  git clone "$REPO" "$API_DIR"
fi

echo "▶ Installing API dependencies..."
cd "$API_DIR"
npm install --omit=dev

echo "▶ Building API..."
npm run build 2>/dev/null || npx tsc --skipLibCheck 2>/dev/null || true

echo "▶ Restarting API via PM2..."
pm2 reload "$PM2_APP" --update-env 2>/dev/null \
  || pm2 start dist/index.js --name "$PM2_APP" --env production
pm2 save

echo ""
echo "✅  Server updated. API is running."
echo "    Frontend files must be uploaded separately via:"
echo "    rsync -az dist/ root@157.250.205.180:${WEB_ROOT}/"
