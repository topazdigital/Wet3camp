#!/usr/bin/env bash
# ============================================================
#  setup-server.sh — Run from the project root on the server
#
#  cd /home/admin/domains/wet3.camp/public_html
#  chmod +x scripts/setup-server.sh && scripts/setup-server.sh
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
git config --global --add safe.directory "$PROJECT_DIR" 2>/dev/null || true
git pull origin main 2>/dev/null || git pull 2>/dev/null || echo "  (git pull skipped)"

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
echo "  Built → $DIST_DIR"

# ── 4. Build API ─────────────────────────────────────────────
echo ""
echo "▶ [4/6] Building API server..."
cd "$API_DIR" && pnpm run build && cd "$PROJECT_DIR"
echo "  Built → $API_DIR/dist/index.mjs"

# ── 5. Copy built files to web root ──────────────────────────
echo ""
echo "▶ [5/6] Copying frontend to web root..."
# Copy dist files to web root so Apache serves them directly
# (avoids complex subdirectory rewriting in .htaccess)
rsync -a --delete \
  --exclude='.git' \
  --exclude='artifacts' \
  --exclude='scripts' \
  --exclude='lib' \
  --exclude='node_modules' \
  --exclude='.htaccess' \
  --exclude='pnpm-lock.yaml' \
  --exclude='pnpm-workspace.yaml' \
  --exclude='package.json' \
  --exclude='tsconfig*.json' \
  --exclude='.replit' \
  --exclude='.gitignore' \
  "$DIST_DIR/" "$PROJECT_DIR/"
echo "  Files copied to web root."

# Write a simple, bulletproof SPA .htaccess (no subdirectory rewriting)
cat > "$PROJECT_DIR/.htaccess" << 'HTACCESS'
Options -Indexes
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^ /index.html [L]
HTACCESS
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

# ── 7. Auto-run scraper in background (adds new profiles from live sites) ─────
echo ""
echo "▶ [7/7] Starting escort scraper in background..."
if [ -n "${DATABASE_URL:-}" ]; then
  # Scraper is already running — skip to avoid overlap
  if pgrep -f "scrape-escorts.mjs" > /dev/null 2>&1; then
    echo "  Scraper already running — skipping."
  else
    cd "$API_DIR" && nohup node scrape-escorts.mjs --fast \
      > /tmp/scraper-$(date +%Y%m%d-%H%M%S).log 2>&1 &
    echo "  Scraper started in background (PID $!)"
    echo "  Logs: /tmp/scraper-*.log"
    cd "$PROJECT_DIR"
  fi
else
  echo "  DATABASE_URL not set — skipping scraper (set it in environment)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅  Deploy complete!"
echo "   Site: https://wet3.camp"
echo "   API:  http://127.0.0.1:$API_PORT  (PM2: $PM2_APP)"
echo ""
echo "   To update services/languages/rates for existing escorts:"
echo "   node $API_DIR/scrape-escorts.mjs --update"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
