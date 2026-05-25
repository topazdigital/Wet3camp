#!/usr/bin/env bash
# ============================================================
#  setup-server.sh — Run this FROM the project root on the server
#
#  Usage (you are already in the right place):
#    cd /home/admin/domains/wet3.camp/public_html
#    chmod +x scripts/setup-server.sh
#    scripts/setup-server.sh
#
#  What it does:
#    1. Pulls latest code from git
#    2. Installs all dependencies
#    3. Builds the React frontend → artifacts/wet3camp/dist/public/
#    4. Builds the API server   → artifacts/api-server/dist/index.mjs
#    5. Writes .htaccess so Apache serves the built frontend
#    6. Starts / restarts the API with PM2 on port 8080
# ============================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DIST_DIR="$PROJECT_DIR/artifacts/wet3camp/dist/public"
API_DIR="$PROJECT_DIR/artifacts/api-server"
PM2_APP="wet3camp-api"
API_PORT=8080

cd "$PROJECT_DIR"
echo "▶ Project root: $PROJECT_DIR"

# ── 1. Pull latest code ──────────────────────────────────────
echo ""
echo "▶ [1/6] Pulling latest code..."
git pull origin main 2>/dev/null || git pull 2>/dev/null || echo "  (skipping git pull — not a git repo or already up to date)"

# ── 2. Install dependencies ──────────────────────────────────
echo ""
echo "▶ [2/6] Installing dependencies..."
if command -v pnpm &>/dev/null; then
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
else
  echo "  pnpm not found — installing it globally..."
  npm install -g pnpm
  pnpm install
fi

# ── 3. Build frontend ────────────────────────────────────────
echo ""
echo "▶ [3/6] Building frontend..."
PORT=80 BASE_PATH=/ pnpm --filter @workspace/wet3camp run build
echo "  Built → $DIST_DIR"

# ── 4. Build API ─────────────────────────────────────────────
echo ""
echo "▶ [4/6] Building API server..."
cd "$API_DIR"
pnpm run build
cd "$PROJECT_DIR"
echo "  Built → $API_DIR/dist/index.mjs"

# ── 5. Write .htaccess ───────────────────────────────────────
echo ""
echo "▶ [5/6] Writing .htaccess..."
HTACCESS="$PROJECT_DIR/.htaccess"

# Back up existing one first
[ -f "$HTACCESS" ] && cp "$HTACCESS" "$HTACCESS.bak" && echo "  Backed up old .htaccess → .htaccess.bak"

cat > "$HTACCESS" << 'HTACCESS_CONTENT'
Options -Indexes
RewriteEngine On

# ── Proxy /api/* to Node.js API on port 8080 ──────────────────
# Requires Apache mod_proxy + mod_proxy_http (enable in DirectAdmin → Apache Extensions)
<IfModule mod_proxy.c>
  ProxyPreserveHost On
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^(api/.*)$ http://127.0.0.1:8080/$1 [P,L]
</IfModule>

# ── Serve built frontend from artifacts/wet3camp/dist/public/ ──
# Pass through real files/directories first
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]

# Rewrite all other requests to the dist folder
RewriteCond %{REQUEST_URI} !^/artifacts/wet3camp/dist/public/
RewriteRule ^(.*)$ artifacts/wet3camp/dist/public/$1 [L]

# SPA fallback — send unknown paths to index.html
RewriteCond %{DOCUMENT_ROOT}/artifacts/wet3camp/dist/public%{REQUEST_URI} !-f
RewriteRule ^ artifacts/wet3camp/dist/public/index.html [L]
HTACCESS_CONTENT

echo "  .htaccess written."

# ── 6. Start API with PM2 ────────────────────────────────────
echo ""
echo "▶ [6/6] Starting API via PM2 on port $API_PORT..."
if ! command -v pm2 &>/dev/null; then
  echo "  pm2 not found — installing globally..."
  npm install -g pm2
fi

PORT=$API_PORT pm2 reload "$PM2_APP" --update-env 2>/dev/null \
  || PORT=$API_PORT pm2 start "$API_DIR/dist/index.mjs" \
       --name "$PM2_APP" \
       --env production \
       --interpreter node \
       -- --enable-source-maps

pm2 save
pm2 startup 2>/dev/null | tail -1 || true   # print the startup command to run as root

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Deploy complete!"
echo "   Site:  https://wet3.camp"
echo "   API:   http://127.0.0.1:$API_PORT"
echo ""
echo "   If /api/ calls fail, enable mod_proxy in DirectAdmin:"
echo "   DirectAdmin → Extra Features → Apache Extensions → mod_proxy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
