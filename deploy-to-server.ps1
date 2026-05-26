# ============================================================
# wet3.camp Deploy Script (PowerShell)
#
# USAGE (run from repo root on your Windows machine):
#   .\deploy-to-server.ps1
#
# FIRST-TIME SETUP:
#   1. Edit server.env with your real DB password and JWT secret
#   2. Run: .\deploy-to-server.ps1 -FirstDeploy
#      This uploads server.env to the server so keys are stored there.
#      After that, just run .\deploy-to-server.ps1 for all future deploys.
#
# REQUIREMENTS:
#   - OpenSSH installed (built into Windows 10/11) — test with: ssh -V
#   - pnpm installed — test with: pnpm -v
#   - SSH key auth set up OR you'll be prompted for a password each step
# ============================================================

param(
    [string]$ServerHost  = "157.250.205.180",
    [string]$ServerUser  = "admin",
    [string]$WebRoot     = "/home/admin/domains/wet3.camp/public_html",
    [string]$ApiDir      = "/home/admin/api-server",
    [switch]$FirstDeploy = $false
)

$ErrorActionPreference = "Stop"
$SSH  = "${ServerUser}@${ServerHost}"

# ── 1. BUILD ────────────────────────────────────────────────
Write-Host ""
Write-Host "==> [1/4] Building project..." -ForegroundColor Cyan
pnpm install --frozen-lockfile
$env:PORT = "19099"; $env:BASE_PATH = "/"
pnpm --filter "@workspace/wet3camp"  run build
pnpm --filter "@workspace/api-server" run build
Write-Host "    Build complete." -ForegroundColor Green

# ── 2. UPLOAD ENV FILE (first deploy only) ──────────────────
if ($FirstDeploy) {
    if (-not (Test-Path "server.env")) {
        Write-Host ""
        Write-Host "ERROR: server.env not found. Create it first:" -ForegroundColor Red
        Write-Host "  Copy server.env.example to server.env and fill in your values." -ForegroundColor Yellow
        exit 1
    }
    Write-Host ""
    Write-Host "==> [2/4] Uploading server.env to server (first deploy)..." -ForegroundColor Cyan
    ssh $SSH "mkdir -p $ApiDir"
    scp "server.env" "${SSH}:${ApiDir}/.env"
    Write-Host "    server.env uploaded as $ApiDir/.env" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "==> [2/4] Skipping .env upload (use -FirstDeploy to upload it)." -ForegroundColor DarkGray
}

# ── 3. UPLOAD BUILT FILES ───────────────────────────────────
Write-Host ""
Write-Host "==> [3/4] Uploading files to server..." -ForegroundColor Cyan

# Frontend static files → public_html
Write-Host "    Uploading frontend..."
ssh $SSH "mkdir -p $WebRoot"
scp -r "artifacts/wet3camp/dist/public/." "${SSH}:${WebRoot}/"

# API server bundle + package.json
Write-Host "    Uploading API server..."
ssh $SSH "mkdir -p $ApiDir/dist"
scp -r "artifacts/api-server/dist/."       "${SSH}:${ApiDir}/dist/"
scp    "artifacts/api-server/package.json" "${SSH}:${ApiDir}/package.json"

Write-Host "    Upload complete." -ForegroundColor Green

# ── 4. RESTART API SERVER ON REMOTE ─────────────────────────
Write-Host ""
Write-Host "==> [4/4] Restarting API server on server..." -ForegroundColor Cyan

$remoteCmd = @"
set -e
cd $ApiDir

# Install production deps (fast — skips devDeps)
npm install --omit=dev --no-package-lock --silent 2>/dev/null || true

# Load .env file into this shell session
if [ -f .env ]; then
  set -a
  source .env
  set +a
  echo '    .env loaded'
else
  echo 'WARNING: No .env file found at $ApiDir/.env — API will start without DB/JWT config!'
fi

# Restart if already running, otherwise start fresh
if pm2 describe wet3camp-api > /dev/null 2>&1; then
  pm2 restart wet3camp-api --update-env
  echo '    PM2 process restarted'
else
  pm2 start dist/index.mjs --name wet3camp-api \
    --node-args='--enable-source-maps' \
    --time
  echo '    PM2 process started'
fi

pm2 save
echo '✅ API server is live'
"@

ssh $SSH $remoteCmd

Write-Host ""
Write-Host "✅ Deploy complete! Your site is live at https://wet3.camp" -ForegroundColor Green
Write-Host ""
