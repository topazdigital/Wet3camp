#!/usr/bin/env bash
# ============================================================
# push-to-github.sh — Run this from the Replit Shell
#
# Usage:
#   bash push-to-github.sh
#
# Requires GITHUB_TOKEN to be set in Replit Secrets.
# Add it once: Replit sidebar → 🔒 Secrets → GITHUB_TOKEN
# ============================================================

set -e

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN is not set."
  echo ""
  echo "Please add it to Replit Secrets:"
  echo "  1. Click the 🔒 Secrets icon in the Replit left sidebar"
  echo "  2. Add key: GITHUB_TOKEN"
  echo "  3. Add value: your GitHub Personal Access Token"
  echo "  4. Click 'Add Secret'"
  echo "  5. Run this script again: bash push-to-github.sh"
  exit 1
fi

echo "▶ Pushing to GitHub..."
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/topazdigital/Wet3camp.git"
git push origin main
git remote set-url origin "https://github.com/topazdigital/Wet3camp.git"

echo ""
echo "✅ Pushed to GitHub successfully!"
echo ""
echo "Now SSH into your server and run:"
echo "  cd /home/admin/wet3camp-build && git pull origin main && bash deploy-on-server.sh"
