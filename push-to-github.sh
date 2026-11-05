#!/usr/bin/env bash
# ============================================================
# push-to-github.sh
#
# Pushes latest Replit changes to GitHub.
# GitHub pushes no longer deploy automatically; deploy to the server manually.
#
# Run from the Replit Shell tab:
#   bash push-to-github.sh
#
# GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN is stored in Replit Secrets — no input needed.
# ============================================================

set -e

TOKEN="${GITHUB_TOKEN:-${GITHUB_PERSONAL_ACCESS_TOKEN:-}}"

if [ -z "$TOKEN" ]; then
  echo "❌ GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN not found in Replit Secrets."
  echo "   If already added, close and reopen the Shell tab to refresh its environment."
  exit 1
fi

echo "▶ Building the production frontend..."
pnpm --filter "@workspace/wet3camp" run build

# The DirectAdmin deploy script intentionally uses this committed build because
# the production host cannot reliably run Vite within its memory limit.
echo "▶ Refreshing the committed frontend build..."
rm -rf artifacts/wet3camp/public-build
mkdir -p artifacts/wet3camp/public-build
cp -a artifacts/wet3camp/dist/public/. artifacts/wet3camp/public-build/

echo "▶ Preparing the complete release commit..."
git add -A
if ! git diff --cached --quiet; then
  git commit -m "${PUSH_COMMIT_MESSAGE:-Update Wet3Camp application}"
else
  echo "   No local changes need committing."
fi

echo "▶ Pushing to GitHub..."

# Keep the token out of the remote URL and command arguments. Git asks this
# short-lived helper for credentials only during this push.
ASKPASS_SCRIPT="$(mktemp)"
PUSH_LOG="$(mktemp)"
cleanup() {
  rm -f "$ASKPASS_SCRIPT" "$PUSH_LOG"
}
trap cleanup EXIT

cat > "$ASKPASS_SCRIPT" <<'ASKPASS'
#!/usr/bin/env bash
case "$1" in
  *Username*) printf '%s\n' "x-access-token" ;;
  *) printf '%s\n' "$TOKEN" ;;
esac
ASKPASS
chmod 700 "$ASKPASS_SCRIPT"

if TOKEN="$TOKEN" \
  GIT_ASKPASS="$ASKPASS_SCRIPT" \
  GIT_TERMINAL_PROMPT=0 \
  git push "https://github.com/topazdigital/Wet3camp.git" main >"$PUSH_LOG" 2>&1; then
  cat "$PUSH_LOG"
  PUSH_METHOD="Git push"
else
  PUSH_EXIT=$?
  cat "$PUSH_LOG"

  # Replit can route git pushes through its source-control proxy, which
  # requires a connected Git pane. When that specific proxy is unavailable,
  # sync changed files through the existing GitHub REST API script instead.
  if grep -q "github.replit.internal" "$PUSH_LOG"; then
    echo "▶ Replit Git proxy is unavailable; syncing changed files through GitHub API..."
    GITHUB_TOKEN="$TOKEN" bash scripts/auto-push.sh main
    PUSH_METHOD="GitHub API fallback"
  else
    exit "$PUSH_EXIT"
  fi
fi

echo ""
echo "✅ Pushed to GitHub via ${PUSH_METHOD}."
echo ""
echo "ℹ️  This push will not deploy to wet3.camp automatically."
echo "   Deploy to the server manually when you are ready."
echo ""
echo "   (The optional manual GitHub Actions deploy needs DEPLOY_SSH_KEY in repo Secrets.)"
