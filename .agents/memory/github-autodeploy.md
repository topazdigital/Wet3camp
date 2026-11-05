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
