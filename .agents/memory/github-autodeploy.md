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

## Git safety and the Replit GitHub proxy
Git write commands in the agent shell may be intercepted by Replit's safety gate. When the user explicitly authorizes a push, retry the intended command with `DANGEROUSLY_ALLOW_GIT=1`. The existing push script still handles the build, release assets, and credential prompt without printing the token.

Even when the PAT secret is present, the secure GitHub proxy can reject pushes with HTTP 400 if the Replit Git source-control connection is disconnected. Attaching the GitHub API integration does not reconnect Git pane source control.

**Why:** The push script reaches GitHub through Replit's secure proxy, which requires an active source-control connection independent of the PAT secret.

**How to apply:** Reconnect under Tools → Git → Manage, then retry `bash push-to-github.sh` once. Do not bypass the secure proxy.

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
