---
name: GitHub auto-deploy setup
description: GITHUB_TOKEN in Replit Secrets; push via Shell; GitHub Actions auto-deploys to server
---

## Rule
`GITHUB_TOKEN` is set in Replit Secrets. Do NOT ask the user to provide it — it is already there.

## Current deploy flow
1. Agent makes changes in Replit
2. User runs `bash push-to-github.sh` from the **Replit Shell tab** — this pushes to GitHub
3. GitHub Actions (`.github/workflows/deploy.yml`) triggers on push to `main` and SSHs into server to run `deploy-on-server.sh`
4. For step 3 to work, `DEPLOY_SSH_KEY` must be set in **GitHub repo Secrets** (Settings → Secrets → Actions)

## Why git push is blocked from the agent
`git push` is blocked in the Replit main-agent sandbox as a destructive git operation. The user MUST run `bash push-to-github.sh` from the Shell tab. This is a platform-level restriction, not a token issue.

## Credentials
- `GITHUB_TOKEN` — in Replit Secrets ✅ (never ask again)
- `DEPLOY_SSH_KEY` — must be in GitHub repo Secrets for GitHub Actions to SSH into server
- `DEPLOY_SSH_PASSPHRASE` — optional, also in GitHub repo Secrets if key has passphrase
- Server: root@157.250.205.180, build dir: /home/admin/wet3camp-build

## MySQL column names (IMPORTANT)
- `shop_products` table uses `price_kes` + `image_url` (NOT `price`/`image`)
- Frontend handles both via `p.price ?? p.price_kes` and `p.image ?? p.image_url`
- All seed INSERTs in migration SQL use `price_kes`/`image_url`

**How to apply:** If user asks why auto-deploy isn't working — check DEPLOY_SSH_KEY is set in GitHub repo Secrets. The GITHUB_TOKEN is fine.
