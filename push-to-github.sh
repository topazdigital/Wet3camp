#!/usr/bin/env bash
# ============================================================
# push-to-github.sh
#
# Pushes latest Replit changes to GitHub.
# GitHub Actions then automatically deploys to wet3.camp.
#
# Run from the Replit Shell tab:
#   bash push-to-github.sh
#
# GITHUB_TOKEN is stored in Replit Secrets — no input needed.
# ============================================================

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN not found in Replit Secrets."
  echo "   Add it via the 🔒 Secrets tab in Replit, then try again."
  exit 1
fi

echo "▶ Pushing to GitHub..."
git push "https://${GITHUB_TOKEN}@github.com/topazdigital/Wet3camp.git" main

echo ""
echo "✅ Pushed to GitHub!"
echo ""
echo "🚀 GitHub Actions is now deploying automatically to wet3.camp"
echo "   Watch progress at: https://github.com/topazdigital/Wet3camp/actions"
echo ""
echo "   (Make sure DEPLOY_SSH_KEY is set in GitHub repo Secrets for auto-deploy to work)"
