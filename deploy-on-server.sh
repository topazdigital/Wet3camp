#!/bin/bash
# ============================================================
# wet3.camp Server-Side Deploy Script
# Run this ON your server (single command):
#   bash /home/admin/wet3camp-build/deploy-on-server.sh
# ============================================================

set -e

REPO_DIR="/home/admin/wet3camp-build"

# --- CONCURRENCY GUARD -----------------------------------------------------
# If an SSH connection from a previous deploy drops (network blip, GH Action
# timeout, etc.) before the remote script finishes, bash keeps running
# detached/orphaned on the server. A second deploy then starts concurrently
# on the SAME repo/node_modules tree, and the two `pnpm install` processes
# race each other — one process's in-flight rename/unlink of a .bin symlink
# collides with the other's, which pnpm reports as a spurious EACCES. Kill
# any previous deploy process for this repo before proceeding so only one
# ever runs at a time.
LOCK_FILE="/tmp/wet3camp-deploy.lock"
if [ -f "$LOCK_FILE" ]; then
  OLD_PID="$(cat "$LOCK_FILE" 2>/dev/null || true)"
  if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
    echo "==> Previous deploy (PID $OLD_PID) still running — killing it and its children to avoid a race..."
    pkill -9 -P "$OLD_PID" 2>/dev/null || true
    kill -9 "$OLD_PID" 2>/dev/null || true
    sleep 1
  fi
fi
# Also sweep for any other pnpm/node install processes still touching this
# repo, in case they got reparented and aren't a child of the recorded PID.
pkill -9 -f "pnpm.*${REPO_DIR}" 2>/dev/null || true
pkill -9 -f "node.*${REPO_DIR}/node_modules" 2>/dev/null || true
echo $ > "$LOCK_FILE"
# --- END CONCURRENCY GUARD --------------------------------------------------

# Fix git "dubious ownership" error when running as root via SSH
git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true

echo ""
echo "==> [0/7] Pulling latest code from GitHub..."
cd "$REPO_DIR"
git fetch origin main
git reset --hard origin/main
echo "    Code is now up to date with GitHub."

# --- DIAGNOSTICS: help debug the persistent EACCES node_modules issue ---
echo "    [diag] whoami: $(whoami)  id: $(id)"
echo "    [diag] deploy-on-server.sh checksum: $(md5sum "$REPO_DIR/deploy-on-server.sh" 2>&1)"
echo "    [diag] REPO_DIR ownership/perms: $(ls -ld "$REPO_DIR" 2>&1)"
echo "    [diag] node_modules ownership/perms: $(ls -ld "$REPO_DIR/node_modules" 2>&1)"
BAD_FILE="$REPO_DIR/node_modules/.pnpm/pino-http@10.5.0/node_modules/pino-http/node_modules/.bin/pino"
echo "    [diag] offending file stat: $(ls -la "$BAD_FILE" 2>&1)"
echo "    [diag] offending file parent dir perms: $(ls -ld "$(dirname "$BAD_FILE")" 2>&1)"
# --- END DIAGNOSTICS ---

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
# Some files inside node_modules can end up owned by a different OS user
# (e.g. a previous deploy accidentally run as root instead of admin), which
# makes `rm -rf` fail with EACCES on individual files even though we own the
# containing directories. Deleting a directory's *contents* needs write
# access to each file's parent dir; renaming the directory itself only needs
# write access to the parent (which admin owns), so this sidesteps the
# problem entirely. This is a pnpm workspace, so EVERY package (root +
# artifacts/* + lib/*) can have its own nested node_modules — clean all of
# them, not just the root one. Stale copies are removed best-effort after.
TS="$(date +%s)"
while IFS= read -r -d '' NM_DIR; do
  STALE_DIR="${NM_DIR}.stale.${TS}"
  if mv "$NM_DIR" "$STALE_DIR" 2>/dev/null; then
    echo "    Moved aside: $NM_DIR -> $(basename "$STALE_DIR")"
    ( rm -rf "$STALE_DIR" 2>/dev/null || true ) &
  else
    echo "    Could not move aside: $NM_DIR (unexpected) — continuing anyway."
  fi
done < <(find "$REPO_DIR" -maxdepth 3 -type d -name node_modules -print0 2>/dev/null)
CI=true pnpm install --frozen-lockfile --config.confirmModulesPurge=false
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
add_if_missing "APP_URL"      "https://wet3.camp"
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
add_if_missing "STATIC_DIR"   "/home/admin/api-server/public"
# Uploads stay in the build repo folder — this is where the API has always written them
add_if_missing "UPLOADS_DIR"  "/home/admin/wet3camp-build/artifacts/api-server/uploads"

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
# Same stale-ownership/concurrent-deploy hazard applies to build output dirs
# (dist/) as it did to node_modules — a previous interrupted build can leave
# files vite's rimraf can't unlink. Move them aside rather than rm -rf.
TS_DIST="$(date +%s)"
for DIST_DIR in "$REPO_DIR/artifacts/wet3camp/dist" "$REPO_DIR/artifacts/api-server/dist"; do
  if [ -d "$DIST_DIR" ]; then
    STALE_DIST="${DIST_DIR}.stale.${TS_DIST}"
    if mv "$DIST_DIR" "$STALE_DIST" 2>/dev/null; then
      echo "    Moved aside: $DIST_DIR -> $(basename "$STALE_DIST")"
      ( rm -rf "$STALE_DIST" 2>/dev/null || true ) &
    else
      echo "    Could not move aside: $DIST_DIR (unexpected) — continuing anyway."
    fi
  fi
done
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

# ── Ensure uploads dir exists; remove any stale symlink in web root ───────────
# Uploads live permanently in the build repo folder (where the API writes them).
# mod_proxy forwards ALL /api/* requests to Node.js, which serves uploads via
# express.static — no symlink needed and symlinks caused Apache 403 on shared hosts.
UPLOADS_REAL="/home/admin/wet3camp-build/artifacts/api-server/uploads"
mkdir -p "${UPLOADS_REAL}"
# Remove any existing symlink that was created by older deploy runs
rm -f "${WEB_ROOT}/api/uploads"
# Also remove the /api dir from webroot if it's now empty (prevents potential dir-listing 403)
rmdir "${WEB_ROOT}/api" 2>/dev/null || true
echo "    Uploads dir: $UPLOADS_REAL (served via Node.js mod_proxy)"

# Write .htaccess
# Strategy:
#   1. Serve real static files/dirs directly (JS/CSS/images from Vite build)
#   2a. Proxy /api/* and known server routes to Node.js
#   2b. Proxy social-media bot/crawler requests to Node.js for dynamic OG meta tags
#       — bots hitting / or /@slug will get the OG middleware response with real photos
#   3. SPA fallback for all remaining routes (regular browser users)
cat > "$WEB_ROOT/.htaccess" << 'HTACCESS'
Options -Indexes

# Serve pre-compressed files
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript application/json
</IfModule>

# --- Cache rules ---

# HTML: never cache
<FilesMatch "\.(html)$">
  Header set Cache-Control "no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires "0"
</FilesMatch>

# Hashed JS/CSS assets (Vite adds content hash): cache 1 year
<FilesMatch "\.(js|css|mjs)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Fonts: cache 1 year
<FilesMatch "\.(woff2?|ttf|eot|otf)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# Images: cache 30 days
<FilesMatch "\.(jpg|jpeg|png|gif|webp|svg|ico)$">
  Header set Cache-Control "public, max-age=2592000"
</FilesMatch>

# JSON/XML manifests: 1 hour
<FilesMatch "\.(json|xml|webmanifest)$">
  Header set Cache-Control "public, max-age=3600"
</FilesMatch>

<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Step 1: Proxy social-media bots to Node.js FIRST (before static file check)
  # Must be first so that / (a directory) is also proxied, not served as index.html.
  # The OG Preview middleware handles the request and calls next() for non-HTML paths.
  RewriteCond %{HTTP_USER_AGENT} "(facebookexternalhit|facebot|WhatsApp|TelegramBot|LinkedInBot|Twitterbot|Slackbot|Discordbot|Applebot|Googlebot|Bingbot|YandexBot|DuckDuckBot|ia_archiver|SemrushBot|AhrefsBot)" [NC]
  RewriteRule ^ http://localhost:8080%{REQUEST_URI} [P,L,QSA]

  # Step 2: Serve real frontend static files/dirs directly for regular browser users
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]

  # Step 3: Proxy /api/* and known server routes to Node.js on port 8080
  RewriteCond %{REQUEST_URI} ^/api [NC,OR]
  RewriteCond %{REQUEST_URI} ^/sitemap [NC,OR]
  RewriteCond %{REQUEST_URI} ^/google [NC]
  RewriteRule ^ http://localhost:8080%{REQUEST_URI} [P,L,QSA]

  # Step 4: SPA fallback — all other routes serve index.html for regular browser users
  RewriteRule ^ index.html [L]
</IfModule>
HTACCESS

echo "    .htaccess written (static direct, /api/* + bot UA proxied to Node.js, SPA fallback)."

# ALSO copy frontend to api-server/public so Express can serve it as a fallback
# if the Apache mod_rewrite [P] proxy doesn't work on this server
mkdir -p "$API_DIR/public"
rm -rf "${API_DIR:?}/public/"*
cp -r "$REPO_DIR/artifacts/wet3camp/dist/public/." "$API_DIR/public/"
mkdir -p "$API_DIR/dist"
cp -r "$REPO_DIR/artifacts/api-server/dist/." "$API_DIR/dist/"
cp    "$REPO_DIR/artifacts/api-server/package.json" "$API_DIR/"
echo "    Files copied (web root + api-server/public fallback)."

echo ""
echo "==> [7/7] Starting/restarting API server via PM2..."
cd "$API_DIR"
npm install --omit=dev --no-package-lock --silent 2>/dev/null || true

# Source the (now-complete) env file so PM2 inherits all vars
set -a; source "$API_ENV"; set +a
echo "    Env vars loaded from $API_ENV"

# Test that node can load the bundle before handing to PM2
echo "    Testing node can load dist/index.mjs..."
timeout 5 node --enable-source-maps dist/index.mjs 2>&1 | head -20 || true

# Delete stale entry and always start fresh — avoids "Process N not found" errors
pm2 delete wet3camp-api 2>/dev/null || true
pm2 start dist/index.mjs --name wet3camp-api \
  --node-args='--enable-source-maps' \
  --time
pm2 save
echo "    PM2 started."

# Wait a moment then capture PM2 logs for diagnosis
sleep 5
echo "    PM2 process status:"
pm2 show wet3camp-api 2>/dev/null || true
echo "    Recent PM2 logs:"
pm2 logs wet3camp-api --lines 40 --nostream 2>/dev/null || true

# Write PM2 logs to web root for remote diagnosis
PM2_LOG_FILE="${WEB_ROOT}/pm2-status.txt"
{
  echo "=== Deploy at $(date) ==="
  echo "=== PM2 List ==="
  pm2 list 2>&1 || true
  echo ""
  echo "=== API Logs (last 50 lines) ==="
  pm2 logs wet3camp-api --lines 50 --nostream 2>&1 || true
  echo ""
  echo "=== Direct node test ==="
  timeout 3 node --enable-source-maps dist/index.mjs 2>&1 | head -10 || true
} > "$PM2_LOG_FILE" 2>&1
chmod 644 "$PM2_LOG_FILE"
echo "    PM2 diagnostics written to: https://wet3.camp/pm2-status.txt"

echo ""
echo "==> [8/8] Running escort scraper in background (real data from all sources)..."
SCRAPER="$REPO_DIR/artifacts/api-server/scrape-escorts.mjs"
if [ -f "$SCRAPER" ] && [ -n "$DATABASE_URL" ]; then
  SCRAPER_LOG="/tmp/wet3camp-scraper.log"
  DATABASE_URL="$DATABASE_URL" UPLOADS_DIR="$UPLOADS_REAL" \
    nohup node "$SCRAPER" --fast > "$SCRAPER_LOG" 2>&1 &
  SCRAPER_PID=$!
  echo "    Scraper running in background (PID: $SCRAPER_PID)"
  echo "    Live log: tail -f $SCRAPER_LOG"
  echo "    When done, new escorts appear in admin panel for approval."
else
  echo "    Skipped — SCRAPER not found or DATABASE_URL not set."
fi

echo ""
echo "==> [9/9] Setting up nightly scraper cron job (3 AM Nairobi time = midnight UTC)..."
SCRAPER_CRON="0 0 * * * source /home/admin/api-server/env && cd /home/admin/wet3camp-build/artifacts/api-server && DATABASE_URL=\"\$DATABASE_URL\" UPLOADS_DIR=\"/home/admin/wet3camp-build/artifacts/api-server/uploads\" /usr/bin/env node scrape-escorts.mjs --fast >> /tmp/wet3camp-scraper-cron.log 2>&1"
# Remove any old scraper cron lines, then append the fresh one
( crontab -l 2>/dev/null | grep -v 'scrape-escorts' ; echo "$SCRAPER_CRON" ) | crontab -
echo "    Cron installed — runs every night at 00:00 UTC (03:00 EAT)."
echo "    View cron log: tail -f /tmp/wet3camp-scraper-cron.log"

echo ""
echo "✅ Deploy complete! https://wet3.camp is now live."
echo ""
echo "─────────────────────────────────────────────────────────────"
echo "⚠️  If any value in $API_ENV says CHANGE_ME, edit it:"
echo "     nano $API_ENV"
echo "   Then run:  pm2 restart wet3camp-api --update-env"
echo "─────────────────────────────────────────────────────────────"
