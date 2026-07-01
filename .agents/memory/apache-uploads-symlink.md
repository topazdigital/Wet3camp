---
name: Apache uploads symlink 403 fix
description: Why /api/uploads images gave 403 on wet3.camp and how it was fixed
---

# Apache Uploads Symlink 403 on Shared Hosting

## The Rule
Never create a symlink inside the Apache web root to serve upload images on shared hosting. Use mod_proxy to forward ALL /api/* requests (including /api/uploads/*) to Node.js express.static instead.

**Why:** Shared hosting Apache configs set AllowOverride without the Options flag. This means `Options +FollowSymLinks` in .htaccess is silently ignored. Apache then gives 403 Forbidden on any request that resolves to a symlinked path — BEFORE mod_rewrite runs, so the proxy rule never fires. JSON API endpoints work fine because those paths don't exist as real files/dirs in the webroot, so they fall through to the proxy cleanly.

**How to apply:** In deploy-on-server.sh, do NOT `ln -sfn` the uploads dir into the webroot. Instead just `mkdir -p` the real uploads dir and remove any stale symlink with `rm -f`. The .htaccess Step 1 (serve real files directly) handles frontend JS/CSS assets from the Vite build; Step 2 proxy handles all /api/* including /api/uploads/* images.

## Diagnostic
- Symptom: image URLs like /api/uploads/xxx.jpg return HTTP 403
- `curl -sI https://wet3.camp/api/uploads/xxx.jpg` shows `server: Apache/2` on the 403 (not Node.js)
- JSON API endpoints (/api/escorts etc.) work fine — they have no matching real file/dir in the webroot

## Fix Applied
- Removed `ln -sfn` from deploy-on-server.sh; added `rm -f` cleanup for any stale symlink
- Live fix: `rm -f /home/admin/domains/wet3.camp/public_html/api/uploads`
