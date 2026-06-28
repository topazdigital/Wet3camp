---
name: GitHub auto-deploy token
description: GITHUB_TOKEN is already stored in Replit Secrets — never ask the user for it again
---

## Rule
`GITHUB_TOKEN` is set in Replit Secrets. Do NOT ask the user to provide it, regenerate it, or add it — it is already there.

## How it is used
- `scripts/auto-push.sh` reads `$GITHUB_TOKEN` and pushes to `https://github.com/topazdigital/Wet3camp.git`
- The script also accepts `GITHUB_PERSONAL_ACCESS_TOKEN` as a fallback (checked second)
- `post-merge.sh` calls `auto-push.sh` automatically after every agent merge → triggers GitHub Actions → deploys to wet3.camp
- Direct git push from the main agent shell is blocked by Replit sandbox; the push only runs via post-merge.sh in the correct context

**Why:** User was frustrated at being asked repeatedly. Token was added on 2026-06-28 and must persist. Never prompt for it again.

**How to apply:** If auto-deploy seems broken, check `scripts/auto-push.sh` and `.github/workflows/deploy.yml` — the token itself is fine.
