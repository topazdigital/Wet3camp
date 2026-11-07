---
name: Manual GitHub deployment
description: Push to GitHub from Replit Shell; server deployment is not triggered by pushes
---

## Rule
`GITHUB_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN` is set in Replit Secrets. Do NOT ask the user to provide it — it is already there.

## Current deploy flow
1. Agent makes changes in Replit.
2. User runs `bash push-to-github.sh` from the **Replit Shell tab** — this builds the frontend, commits if needed, and pushes to GitHub.
3. GitHub Actions does not run on `main` pushes. A manual `workflow_dispatch` can deploy to the server if the user chooses.
4. The user may instead deploy to the server manually after reviewing the GitHub push.

**Why:** The user wants GitHub as a code backup but deploys to the server themselves, so a push must not deploy production.

**How to apply:** Push with `bash push-to-github.sh` from Replit Shell. Use the manual GitHub Actions workflow only when explicitly choosing an automated server deployment.

## Shell push preference
The user wants to push from Replit Shell without reconnecting the Git source-control pane. Use the saved PAT through `bash push-to-github.sh`; its GitHub API fallback handles a disconnected proxy. Never ask for or print the token. If a Shell opened before the secret was added says it is missing, reopen the Shell.

**Why:** The user explicitly said they do not want to connect Git source control and prefer the Shell workflow they use with other agents. GitHub pushes are separate from the manually triggered production deployment.

**How to apply:** Run the Shell push script and confirm it completed; do not trigger the production workflow unless asked.

## Non-fast-forward after API sync
The GitHub Contents API fallback creates one remote commit per changed file but does not advance the workspace's local `origin/main`. A later direct `git push` can therefore report "fetch first" even when the remote commits are prior Replit auto-syncs. Do not force-push. `bash push-to-github.sh` now checks the GitHub compare API and automatically uses `scripts/auto-push.sh main` only when every remote-only commit is a prior `chore: sync/remove ... via Replit auto-push`; if history cannot be verified or contains other commits, it stops for manual reconciliation.

**Why:** GitHub's file-by-file fallback can successfully update the remote tree while leaving local Git history stale; forcing a push would risk deleting those remote commits.

**How to apply:** Run `bash push-to-github.sh` from a fresh Replit Shell. It builds, commits, tries Git push, and safely falls back to the Contents API when its history check passes. The API helper uses a temporary private curl config for the PAT; never put the token in a remote URL or command argument. API pushes do not deploy production or advance local `origin/main`.

## Credentials
- `GITHUB_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN` — in Replit Secrets ✅ (never ask again)
- `DEPLOY_SSH_KEY` — required in GitHub repo Secrets only when manually running the GitHub Actions deployment
- `DEPLOY_SSH_PASSPHRASE` — optional, also in GitHub repo Secrets if key has passphrase
- Server: root@157.250.205.180, build dir: /home/admin/wet3camp-build

## MySQL column names (IMPORTANT)
- `shop_products` table uses `price_kes` + `image_url` (NOT `price`/`image`)
- Frontend handles both via `p.price ?? p.price_kes` and `p.image ?? p.image_url`
- All seed INSERTs in migration SQL use `price_kes`/`image_url`

For a manual GitHub Actions deployment, check that `DEPLOY_SSH_KEY` is set in GitHub repo Secrets.
