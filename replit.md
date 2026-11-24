# Wet3 Camp

Kenya escort marketplace and booking platform — discover, book, and manage companion services.

## ⚠️ DATABASE RULE — READ THIS FIRST — DO NOT SKIP

**MySQL / MariaDB is the ONLY production database. NEVER add PostgreSQL-specific code to the application.**

- The live server at wet3.camp uses MySQL (`admin_wet3camp` on MariaDB 10.6).
- Replit provides a built-in PostgreSQL database. It is used **ONLY** as a dev-environment fallback so the app runs on Replit. It is NOT a migration target and does NOT affect production.
- The `CompatPool` in `artifacts/api-server/src/lib/db.ts` auto-detects `mysql://` vs `postgres://` and translates SQL on the fly. **Never bypass this — all app SQL must be written in MySQL syntax.**
- Future agents: do NOT migrate the schema to Drizzle/PostgreSQL, do NOT rewrite MySQL SQL to pg syntax, do NOT replace mysql2 with pg, do NOT add `RETURNING`, `::cast`, or other pg-only syntax to application SQL. MySQL is permanent and intentional.
- All SQL files (`wet3camp-migration.sql`, `wet3camp_database.sql`) are written in MySQL/MariaDB syntax and must stay that way.
- `scripts/setup-pg-schema.sql` and `scripts/init-pg-dev.sql` are dev-only schema files for Replit PostgreSQL — they exist only to make the app runnable in Replit and have no production relevance. Do not modify the application to depend on them.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wet3camp run dev` — run the frontend (port 5000 by default; the main Replit workflow sets `PORT=5000`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — MySQL connection string on live server (`mysql://user:pass@host/db`); Replit dev falls back to Postgres only if no MySQL URL is set.
- Fresh Replit Postgres dev DB: run `psql "$DATABASE_URL" -f scripts/init-pg-dev.sql` once to create dev tables (migrate.ts skips SQL migrations on Postgres and expects this to already exist). No demo/escort data is seeded — `/api/escorts` returns an empty list until data is added.
- Fresh imported workspace: if the full mobile-inclusive install is blocked by the package firewall, restore the web/API preview with `pnpm install --frozen-lockfile --filter '@workspace/wet3camp...' --filter '@workspace/api-server...'`.
- After completing and verifying each requested code change, push directly to `main` with `bash push-to-github.sh`; do not create a compare branch or pull request or ask for routine push approval. The script refreshes the committed frontend build and pushes the release, but does not deploy to the server. Production deployment is started separately over SSH with `bash /home/admin/wet3camp-build/deploy-on-server.sh`.

## Escort profile imports

- The production cron runs `scripts/run-nairobiraha-scraper.sh` nightly at 03:00 Nairobi time. It now uses `--source=approved`: NairobiRaha plus the ten additional directories the user approved.
- Approved additional directories: `rahaescorts.com`, `raha.ke`, `toplesskenya.com`, `nairobihot.com`, `kenyaraha.com`, `escortamus.com`, `rahaanairobi.com`, `mahabakenya.com`, `lovebiteglobal.com`, and `ladys.one`. Do not add another source without user approval.
- Run a no-write link check from `artifacts/api-server/` with `node scrape-escorts.mjs --source=approved --discover-only`; use `--dry-run --limit=1 --source=<id>` to test one source's profile parser.
- Each added directory is limited to 200 new profile URLs per run. Existing `source_url` records are skipped before profile pages are fetched.
- Directory crawling checks each site's `robots.txt`, uses its public sitemap/listing pages, and does not bypass HTTP blocks or rehost third-party profile photos. A source that denies access or is unavailable is skipped and logged.
- Directory photo selection prefers profile-specific images, rejects known branding/social icons, and skips new profiles without a reliable photo. Preview current-cover cleanup with `node scrape-escorts.mjs --repair-directory-photos --source=approved`; add `--apply` only after reviewing the preview. It changes only missing or likely-placeholder covers, and clears a placeholder when the source has no reliable profile photo.
- A scraper code change does not update the live cron until the normal server deploy installs the revised runner and cron entry.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- **DB: MySQL/MariaDB (primary — live server). PostgreSQL only for Replit dev fallback. Never swap these.**
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/api-server/src/lib/db.ts` — dual-DB shim: MySQL on live, PostgreSQL on Replit
- `artifacts/api-server/src/routes/admin.ts` — admin panel API (escorts, settings, test-connections)
- `artifacts/wet3camp/src/pages/admin.tsx` — admin panel UI
- `artifacts/wet3camp-migration.sql` — full legacy bootstrap for fresh/manual database setup; it includes seed data and is not run during routine deployments.
- `artifacts/wet3camp-migrations/*.sql` — focused, idempotent MySQL migrations applied automatically by the server deploy before the API build. Add one file per schema change; do not include destructive cleanup or seed inserts.

## Architecture decisions

- **Dual-DB CompatPool**: `db.ts` auto-detects MySQL (`mysql://` prefix) vs PostgreSQL. On PostgreSQL it translates MySQL syntax (backticks → double-quotes, GROUP_CONCAT → STRING_AGG, FIELD() → CASE, etc.)
- **RETURNING id guard**: Only appends `RETURNING id` to PostgreSQL INSERTs when `id` is NOT in the column list (auto-generated PKs only — avoids breaking key-value tables like `platform_settings`)
- **Upsert pattern**: Settings are saved with try-INSERT / catch-UPDATE instead of `ON DUPLICATE KEY UPDATE` to avoid MySQL-specific syntax issues across DB backends
- **Admin setup endpoint**: `POST /api/auth/setup-admin` — one-time admin creation, disabled after first use
- **Live deploy**: `cd /home/admin/wet3camp-build && git pull origin main && bash deploy-on-server.sh`
- The production deploy keeps Wet3Camp on its own API port and writes `.htaccess` into a validated frontend release before activation. It checks `/admin` and `/api/healthz` after deployment; if frontend activation fails, the previous release is restored.

## Product

- Escort discovery with location, filters, gallery, reviews, and real-time online status
- Booking system with room marketplace
- Admin panel: escort approval, settings (SMTP, Telegram, API keys), connection testing
- Companion registration flow with OTP verification

## User preferences

- Live server: `wet3.camp` using MySQL database `admin_wet3camp`
- Deploy via PowerShell git push → server-side `git pull` + `deploy-on-server.sh`
- Routine production schema changes are applied from `artifacts/wet3camp-migrations/` during server deployment; no phpMyAdmin step is needed for those migrations.

## Gotchas

- For a fresh production database, review and apply the full legacy bootstrap before deployment. Routine deploys use only the focused migrations in `artifacts/wet3camp-migrations/`.
- The `CompatPool` adds `RETURNING id` only when `id` is not in the INSERT columns — key-value tables (`platform_settings`) have no `id` column and must not get `RETURNING id`
- `platform_settings` column is literally named `key` (a reserved word in both MySQL and PostgreSQL) — always quote it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
