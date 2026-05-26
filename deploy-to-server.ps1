# ============================================================
# wet3.camp One-Command Deploy Script (PowerShell)
# Usage: .\deploy-to-server.ps1
# Run this from the repo root after pushing your changes.
# ============================================================

param(
    [string]$ServerHost = "157.250.205.180",
    [string]$ServerUser = "root",
    [string]$WebRoot    = "/home/admin/domains/wet3.camp/public_html",
    [string]$ApiDir     = "/home/admin/api-server"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Building project..." -ForegroundColor Cyan
pnpm install --frozen-lockfile
$env:PORT = "19099"; $env:BASE_PATH = "/"
pnpm --filter "@workspace/wet3camp" run build
pnpm --filter "@workspace/api-server" run build

Write-Host "==> Uploading frontend to $WebRoot ..." -ForegroundColor Cyan
# Requires OpenSSH (built into Windows 10+) or PuTTY pscp in PATH
scp -r "artifacts/wet3camp/dist/public/*" "${ServerUser}@${ServerHost}:${WebRoot}/"

Write-Host "==> Uploading API server to $ApiDir ..." -ForegroundColor Cyan
scp -r "artifacts/api-server/dist"     "${ServerUser}@${ServerHost}:${ApiDir}/"
scp    "artifacts/api-server/package.json" "${ServerUser}@${ServerHost}:${ApiDir}/"

Write-Host "==> Restarting API server on remote..." -ForegroundColor Cyan
$remoteCmd = @"
cd $ApiDir
npm install --omit=dev --no-package-lock 2>/dev/null || true
pm2 delete wet3camp-api 2>/dev/null || true
pm2 start dist/index.mjs --name wet3camp-api \
  --env PORT=8080 \
  --node-args='--enable-source-maps'
pm2 save
echo '✅ API server restarted'
"@
ssh "${ServerUser}@${ServerHost}" $remoteCmd

Write-Host "✅ Deploy complete! Visit https://wet3.camp" -ForegroundColor Green
