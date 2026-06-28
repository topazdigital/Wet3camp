#!/bin/bash
set -e

pnpm install --frozen-lockfile

# Initialize the dev PostgreSQL schema (safe to re-run — uses IF NOT EXISTS)
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" != mysql* ]]; then
  echo "[post-merge] Initializing dev PostgreSQL schema..."
  psql "$DATABASE_URL" -f scripts/init-pg-dev.sql
fi

# Auto-push to GitHub → triggers GitHub Actions → deploys to wet3.camp
bash scripts/auto-push.sh main
