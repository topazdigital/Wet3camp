#!/bin/bash
# ============================================================
# wet3.camp Server-Side Deploy Script
# Run this ON your server:
#   bash /home/admin/wet3camp-build/deploy-on-server.sh
# ============================================================

set -e

REPO_DIR="/home/admin/wet3camp-build"
WEB_ROOT="/home/admin/domains/wet3.camp/public_html"
API_DIR="/home/admin/api-server"

echo ""
echo "==> [1/5] Pulling latest code from GitHub..."
cd "$REPO_DIR"
git merge --abort 2>/dev/null || true
git reset --hard HEAD
git pull origin main
echo "    Done."

echo ""
echo "==> [2/5] Installing pnpm (if not already installed)..."
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm
fi
echo "    pnpm $(pnpm --version)"

echo ""
echo "==> [3/5] Installing dependencies and building..."
pnpm install --frozen-lockfile
PORT=19099 BASE_PATH=/ pnpm --filter "@workspace/wet3camp"  run build
pnpm --filter "@workspace/api-server" run build
echo "    Build complete."

echo ""
echo "==> [4/5] Copying files to live folders..."
mkdir -p "$WEB_ROOT"
cp -r "$REPO_DIR/artifacts/wet3camp/dist/public/." "$WEB_ROOT/"
mkdir -p "$API_DIR/dist"
cp -r "$REPO_DIR/artifacts/api-server/dist/."     "$API_DIR/dist/"
cp    "$REPO_DIR/artifacts/api-server/package.json" "$API_DIR/"
echo "    Files copied."

echo ""
echo "==> [5/5] Starting/restarting API server via PM2..."
cd "$API_DIR"
npm install --omit=dev --no-package-lock --silent 2>/dev/null || true

if [ ! -f .env ]; then
  echo ""
  echo "  ⚠️  No .env file found at $API_DIR/.env"
  echo "  Create it first by running the setup command shown at the end."
  echo ""
fi

if [ -f .env ]; then
  set -a; source .env; set +a
fi

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
echo "── If the API isn't working, create the .env with: ──"
echo "cat > $API_DIR/.env << 'EOF'"
echo "PORT=8080"
echo "DB_HOST=localhost"
echo "DB_USER=admin_wet3camp"
echo "DB_PASS=YOUR_PASSWORD_HERE"
echo "DB_NAME=admin_wet3camp"
echo "DB_PORT=3306"
echo "JWT_SECRET=YOUR_LONG_SECRET_HERE"
echo "NODE_ENV=production"
echo "EOF"
echo "Then run:  pm2 restart wet3camp-api --update-env"
