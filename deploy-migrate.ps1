# =============================================================================
# Wet3.camp — Push DB Migration via PowerShell (SSH)
# Run from your Windows machine:
#   .\deploy-migrate.ps1
#
# REQUIREMENTS: OpenSSH must be installed (it is by default on Windows 10/11)
# Fill in your SSH details below before running.
# =============================================================================

# ── CONFIGURE THESE ──────────────────────────────────────────────────────────
$SSH_USER   = "admin"                          # your SSH username
$SSH_HOST   = "157.250.205.180"                # your server IP
$SSH_PORT   = 22                               # SSH port (usually 22)
# Path to your private key — leave empty to use password auth
$SSH_KEY    = ""                               # e.g. "C:\Users\You\.ssh\id_rsa"
# ─────────────────────────────────────────────────────────────────────────────

$REPO_DIR   = "/home/admin/wet3camp-build"
$ENV_FILE   = "/home/admin/api-server/env"
$SQL_FILE   = "$REPO_DIR/artifacts/wet3camp-migration.sql"

Write-Host ""
Write-Host "=== Wet3.camp DB Migration ===" -ForegroundColor Cyan
Write-Host ""

# Build SSH args
$sshArgs = @("-p", $SSH_PORT, "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=15")
if ($SSH_KEY -ne "") {
    $sshArgs += @("-i", $SSH_KEY)
}
$sshTarget = "${SSH_USER}@${SSH_HOST}"

# The command to run on the server
$remoteCmd = @"
set -e
echo '[1/3] Reading DB credentials from env file...'
if [ ! -f '$ENV_FILE' ]; then
  echo 'ERROR: Env file not found at $ENV_FILE'
  echo 'Run deploy-on-server.sh first to create it.'
  exit 1
fi
set -a; source '$ENV_FILE'; set +a

if [ -z "\$DB_HOST" ] || [ -z "\$DB_USER" ] || [ -z "\$DB_NAME" ]; then
  echo 'ERROR: DB_HOST / DB_USER / DB_NAME not set in env file.'
  echo "Edit $ENV_FILE and fill in the real values, then re-run."
  exit 1
fi

echo "[2/3] Connecting to MySQL \$DB_USER@\$DB_HOST:\${DB_PORT:-3306}/\$DB_NAME ..."
MYSQL_CMD="mysql -h\${DB_HOST} -P\${DB_PORT:-3306} -u\${DB_USER} -p\${DB_PASS} \${DB_NAME}"

if ! \$MYSQL_CMD -e 'SELECT 1' > /dev/null 2>&1; then
  echo 'ERROR: Cannot connect to MySQL. Check DB_HOST / DB_USER / DB_PASS in env file.'
  exit 1
fi
echo '       Connected OK.'

echo '[3/3] Running migration SQL...'
\$MYSQL_CMD --force < '$SQL_FILE' 2>&1 | grep -v '^\$' | sed 's/^/    /' || true

echo ''
echo '--- Verifying key tables exist ---'
\$MYSQL_CMD -e "SHOW TABLES LIKE 'platform_settings';" 2>/dev/null | tail -1
\$MYSQL_CMD -e "SHOW TABLES LIKE 'rooms';"              2>/dev/null | tail -1
\$MYSQL_CMD -e "SHOW TABLES LIKE 'escort_gallery';"     2>/dev/null | tail -1

echo ''
echo '✅ Migration complete!'
echo '   Restart the API so it picks up the new tables:'
echo '   pm2 restart wet3camp-api --update-env'
"@

Write-Host "Connecting to $sshTarget ..." -ForegroundColor Yellow
Write-Host ""

try {
    $proc = Start-Process -FilePath "ssh" `
        -ArgumentList ($sshArgs + @($sshTarget, $remoteCmd)) `
        -NoNewWindow -PassThru -Wait

    if ($proc.ExitCode -ne 0) {
        Write-Host ""
        Write-Host "SSH command exited with code $($proc.ExitCode)" -ForegroundColor Red
        Write-Host "Tip: make sure your SSH key or password is correct." -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Could not run ssh. Make sure OpenSSH is installed." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Press Enter to close."
Read-Host
