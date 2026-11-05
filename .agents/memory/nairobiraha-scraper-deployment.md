---
name: NairobiRaha scraper deployment
description: Production cron must use the current checked-out scraper while reading database settings from the protected API env file.
---

The production database environment file is separate from the checked-out API source. Cron should read `DATABASE_URL` from the protected env file but execute the NairobiRaha scraper from the current repository checkout; do not overload `API_DIR` to mean both locations.

**Why:** The deployment cron passed the separate API environment directory as the scraper directory, allowing a stale scraper copy to run and leave current profiles unimported.

**How to apply:** Keep `API_ENV`, `SCRAPER_DIR`, and `UPLOADS_DIR` explicit in cron configuration. After deployment, verify the cron entry and its log output, including discovered URLs, imports, skips, and failure counts.
