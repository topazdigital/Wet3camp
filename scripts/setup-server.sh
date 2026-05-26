#!/usr/bin/env bash
# ============================================================
#  setup-server.sh — Run from the project root on the server
#
#  cd /home/admin/domains/wet3.camp/public_html
#  chmod +x scripts/setup-server.sh && scripts/setup-server.sh
# ============================================================

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
API_DIR="$PROJECT_DIR/artifacts/api-server"
PM2_APP="wet3camp-api"
API_PORT=8080

cd "$PROJECT_DIR"
echo "▶ Project root: $PROJECT_DIR"

# ── 1. Pull latest code ──────────────────────────────────────
echo ""
echo "▶ [1/6] Pulling latest code..."
# Fix "dubious ownership" when running as root on a repo owned by admin
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
git pull origin main 2>/dev/null || git pull 2>/dev/null || echo "  (git pull skipped — check: git remote -v)"

# ── 2. Install dependencies ──────────────────────────────────
echo ""
echo "▶ [2/6] Installing dependencies..."
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi
pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# ── 3. Build frontend ────────────────────────────────────────
echo ""
echo "▶ [3/6] Building frontend..."
PORT=80 BASE_PATH=/ pnpm --filter @workspace/wet3camp run build
echo "  Built → artifacts/wet3camp/dist/public/"

# ── 4. Build API ─────────────────────────────────────────────
echo ""
echo "▶ [4/6] Building API server..."
cd "$API_DIR" && pnpm run build && cd "$PROJECT_DIR"
echo "  Built → artifacts/api-server/dist/index.mjs"

# ── 5. Write .htaccess ───────────────────────────────────────
echo ""
echo "▶ [5/6] Writing .htaccess..."
HTACCESS="$PROJECT_DIR/.htaccess"
[ -f "$HTACCESS" ] && cp "$HTACCESS" "$HTACCESS.bak"

# Remove any old root-level index.html that would shadow the dist build
if [ -f "$PROJECT_DIR/index.html" ]; then
  mv "$PROJECT_DIR/index.html" "$PROJECT_DIR/index.html.old"
  echo "  Moved old root index.html → index.html.old"
fi

cat > "$HTACCESS" << 'HTACCESS_CONTENT'
Options -Indexes
RewriteEngine On

# Skip rewriting if the URI is already inside the dist folder
RewriteCond %{REQUEST_URI} ^/artifacts/wet3camp/dist/public/
RewriteRule ^ - [L]

# Serve real static files that exist in the dist folder
RewriteCond %{DOCUMENT_ROOT}/artifacts/wet3camp/dist/public%{REQUEST_URI} -f
RewriteRule ^(.+)$ artifacts/wet3camp/dist/public/$1 [L]

# SPA fallback — all other routes serve index.html
RewriteRule ^ artifacts/wet3camp/dist/public/index.html [L]
HTACCESS_CONTENT

echo "  .htaccess written."

# ── 6. Start / reload API with PM2 ───────────────────────────
echo ""
echo "▶ [6/6] Starting API via PM2 on port $API_PORT..."
if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

PORT=$API_PORT pm2 reload "$PM2_APP" --update-env 2>/dev/null \
  || PORT=$API_PORT pm2 start "$API_DIR/dist/index.mjs" \
       --name "$PM2_APP" --interpreter node

pm2 save

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Deploy complete!"
echo "   Site: https://wet3.camp"
echo "   API:  http://127.0.0.1:$API_PORT (PM2: $PM2_APP)"
echo ""
echo "   To route /api/ through Apache, enable mod_proxy + mod_proxy_http"
echo "   in DirectAdmin → Extra Features → Apache Extensions, then re-run."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
