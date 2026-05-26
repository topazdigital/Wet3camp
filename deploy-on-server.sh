#!/bin/bash
# ============================================================
# wet3.camp Server-Side Deploy Script
# Run this ON your server:
#   cd /home/admin/wet3camp-build && git pull origin main
#   bash /home/admin/wet3camp-build/deploy-on-server.sh
# ============================================================

set -e

REPO_DIR="/home/admin/wet3camp-build"
WEB_ROOT="/home/admin/domains/wet3.camp/public_html"
API_DIR="/home/admin/api-server"
# NOTE: your env file is named "env" (not ".env") — keep that name
API_ENV="$API_DIR/env"

echo ""
echo "==> [1/6] Installing pnpm (if not already installed)..."
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi
echo "    pnpm $(pnpm --version)"

echo ""
echo "==> [2/6] Installing dependencies..."
cd "$REPO_DIR"
pnpm install --frozen-lockfile
echo "    Done."

echo ""
echo "==> [3/6] Running DB migrations..."
if [ -f "$API_ENV" ]; then
  set -a; source "$API_ENV"; set +a
fi
if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
  MYSQL_CMD="mysql -h$DB_HOST -P${DB_PORT:-3306} -u$DB_USER -p$DB_PASS $DB_NAME"
  if [ -f "$REPO_DIR/artifacts/api-server/sql/add_rooms.sql" ]; then
    $MYSQL_CMD < "$REPO_DIR/artifacts/api-server/sql/add_rooms.sql" 2>/dev/null \
      && echo "    Rooms table migration applied." \
      || echo "    Rooms migration skipped (already applied or no access)."
  fi
else
  echo "    WARNING: DB env vars not found in $API_ENV — skipping migrations."
  echo "    Make sure your env file contains DB_HOST, DB_USER, DB_PASS, DB_NAME."
fi

echo ""
echo "==> [4/6] Building frontend and API..."
PORT=19099 BASE_PATH=/ pnpm --filter "@workspace/wet3camp"  run build
pnpm --filter "@workspace/api-server" run build
echo "    Build complete."

echo ""
echo "==> [5/6] Copying files to live folders..."
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
cp -r "$REPO_DIR/artifacts/wet3camp/dist/." "$WEB_ROOT/"
mkdir -p "$API_DIR/dist"
cp -r "$REPO_DIR/artifacts/api-server/dist/." "$API_DIR/dist/"
cp    "$REPO_DIR/artifacts/api-server/package.json" "$API_DIR/"
echo "    Files copied."

echo ""
echo "==> [6/6] Starting/restarting API server via PM2..."
cd "$API_DIR"
npm install --omit=dev --no-package-lock --silent 2>/dev/null || true

if [ ! -f "$API_ENV" ]; then
  echo ""
  echo "  ⚠️  No env file found at $API_ENV"
  echo "  Create it with the variables shown at the bottom of this script."
  echo ""
fi

if pm2 describe wet3camp-api > /dev/null 2>&1; then
  pm2 restart wet3camp-api --update-env
  echo "    PM2 restarted."
else
  pm2 start dist/index.js --name wet3camp-api \
    --node-args='--enable-source-maps' \
    --time
  pm2 save
  echo "    PM2 started."
fi

echo ""
echo "✅ Deploy complete! https://wet3.camp is now live."
echo ""
echo "─────────────────────────────────────────────────────"
echo "If the API shows 'Service Unavailable', your env file"
echo "is missing DB credentials. Edit $API_ENV to contain:"
echo ""
echo "PORT=8080"
echo "DB_HOST=localhost"
echo "DB_PORT=3306"
echo "DB_USER=admin_betcheza"
echo "DB_PASS=YOUR_MYSQL_PASSWORD"
echo "DB_NAME=admin_wet3camp"
echo "JWT_SECRET=REPLACE_WITH_64_CHAR_RANDOM_STRING"
echo "NODE_ENV=production"
echo ""
echo "Then run:  pm2 restart wet3camp-api --update-env"
echo "─────────────────────────────────────────────────────"
