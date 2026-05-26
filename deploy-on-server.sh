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
echo "==> [1/7] Installing pnpm (if not already installed)..."
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi
echo "    pnpm $(pnpm --version)"

echo ""
echo "==> [2/7] Installing dependencies..."
cd "$REPO_DIR"
pnpm install --frozen-lockfile
echo "    Done."

echo ""
echo "==> [3/7] Ensuring env file has all required vars..."
if [ ! -f "$API_ENV" ]; then
  echo "" > "$API_ENV"
  echo "    Created new env file at $API_ENV"
fi

# Source whatever already exists first
if [ -f "$API_ENV" ]; then
  set -a; source "$API_ENV"; set +a
fi

add_if_missing() {
  local key="$1"
  local value="$2"
  if ! grep -q "^${key}=" "$API_ENV" 2>/dev/null; then
    echo "${key}=${value}" >> "$API_ENV"
    echo "    Added missing: $key"
  fi
}

add_if_missing "PORT"         "8080"
add_if_missing "DB_HOST"      "localhost"
add_if_missing "DB_PORT"      "3306"
add_if_missing "DB_USER"      "admin_wet3camp"
add_if_missing "DB_PASS"      "CHANGE_ME"
add_if_missing "DB_NAME"      "admin_wet3camp"
add_if_missing "JWT_SECRET"   "CHANGE_ME_$(openssl rand -hex 32 2>/dev/null || echo 'replace_with_random_string')"
add_if_missing "NODE_ENV"     "production"
add_if_missing "SMTP_HOST"    "mail.wet3.camp"
add_if_missing "SMTP_PORT"    "587"
add_if_missing "SMTP_USER"    "support@wet3.camp"
add_if_missing "SMTP_PASS"    "CHANGE_ME"

# Re-source so all variables (including newly added ones) are available
set -a; source "$API_ENV"; set +a

# CRITICAL: construct DATABASE_URL from DB_* vars if not already set.
# db.ts only reads DATABASE_URL — without this the API cannot connect to MySQL.
if ! grep -q "^DATABASE_URL=" "$API_ENV" 2>/dev/null; then
  DB_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT:-3306}/${DB_NAME}"
  echo "DATABASE_URL=${DB_URL}" >> "$API_ENV"
  echo "    Built DATABASE_URL from DB_* vars."
else
  echo "    DATABASE_URL already set."
fi

echo "    Env file checked. Edit $API_ENV to fill in any CHANGE_ME values."

echo ""
echo "==> [4/7] Running DB migrations..."
# Re-source to pick up DATABASE_URL
set -a; source "$API_ENV"; set +a

if [ -n "$DB_HOST" ] && [ -n "$DB_USER" ] && [ -n "$DB_NAME" ]; then
  MYSQL_CMD="mysql -h${DB_HOST} -P${DB_PORT:-3306} -u${DB_USER} -p${DB_PASS} ${DB_NAME}"
  MIGRATION_SQL="$REPO_DIR/artifacts/wet3camp-migration.sql"
  if [ -f "$MIGRATION_SQL" ]; then
    echo "    Applying $MIGRATION_SQL ..."
    # Run each statement; continue on non-fatal errors (e.g. column already exists)
    $MYSQL_CMD --force < "$MIGRATION_SQL" 2>&1 | grep -v "^$" | sed 's/^/    /' || true
    echo "    Migration applied (safe to re-run — all statements use IF NOT EXISTS)."
  else
    echo "    WARNING: Migration file not found at $MIGRATION_SQL"
  fi
else
  echo "    WARNING: DB env vars not found in $API_ENV — skipping migrations."
  echo "             Edit $API_ENV and fill in DB_HOST, DB_USER, DB_PASS, DB_NAME."
fi

echo ""
echo "==> [5/7] Building frontend and API..."
cd "$REPO_DIR"
PORT=19099 BASE_PATH=/ pnpm --filter "@workspace/wet3camp"  run build
pnpm --filter "@workspace/api-server" run build
echo "    Build complete."

echo ""
echo "==> [6/7] Copying files to live folders..."
mkdir -p "$WEB_ROOT"
rm -rf "${WEB_ROOT:?}"/*
# Vite outputs to dist/public — copy that subfolder to web root
cp -r "$REPO_DIR/artifacts/wet3camp/dist/public/." "$WEB_ROOT/"
chmod -R 755 "$WEB_ROOT"
mkdir -p "$API_DIR/dist"
cp -r "$REPO_DIR/artifacts/api-server/dist/." "$API_DIR/dist/"
cp    "$REPO_DIR/artifacts/api-server/package.json" "$API_DIR/"
echo "    Files copied."

echo ""
echo "==> [7/7] Starting/restarting API server via PM2..."
cd "$API_DIR"
npm install --omit=dev --no-package-lock --silent 2>/dev/null || true

# Source the (now-complete) env file so PM2 inherits all vars
set -a; source "$API_ENV"; set +a
echo "    Env vars loaded from $API_ENV"

if pm2 describe wet3camp-api > /dev/null 2>&1; then
  pm2 restart wet3camp-api --update-env
  echo "    PM2 restarted."
else
  pm2 start dist/index.mjs --name wet3camp-api \
    --node-args='--enable-source-maps' \
    --time
  pm2 save
  echo "    PM2 started."
fi

echo ""
echo "✅ Deploy complete! https://wet3.camp is now live."
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "⚠️  If any value in $API_ENV says CHANGE_ME, edit it:"
echo "     nano $API_ENV"
echo "   Then run:  pm2 restart wet3camp-api --update-env"
echo "─────────────────────────────────────────────────────────────"
