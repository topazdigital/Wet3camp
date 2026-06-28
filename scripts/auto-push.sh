#!/bin/bash
# =============================================================
# auto-push.sh — Push current branch to GitHub
# Called automatically by post-merge.sh after every agent merge.
# Can also be run manually from the Replit shell.
# =============================================================
set -e

REPO="https://github.com/topazdigital/Wet3camp.git"
BRANCH="${1:-main}"

if [ -z "$GITHUB_TOKEN" ]; then
  echo "[auto-push] ⚠️  GITHUB_TOKEN secret is not set — skipping GitHub push."
  echo "            Add it via Replit Secrets to enable auto-deploy."
  exit 0
fi

echo "[auto-push] Pushing branch '${BRANCH}' to GitHub..."

git config user.email "replit-agent@wet3.camp" 2>/dev/null || true
git config user.name  "Replit Agent"            2>/dev/null || true

# Use token in the URL (never stored in .git/config)
git push "https://${GITHUB_TOKEN}@${REPO#https://}" HEAD:"${BRANCH}" 2>&1 \
  | sed "s/${GITHUB_TOKEN}/***REDACTED***/g"

echo "[auto-push] ✅ Pushed to GitHub. GitHub Actions will deploy to wet3.camp automatically."
