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
- `pnpm --filter @workspace/wet3camp run dev` — run the frontend (port 19099)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- Required env: `DATABASE_URL` — MySQL connection string on live server (`mysql://user:pass@host/db`); Replit dev falls back to Postgres only if no MySQL URL is set.

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
- `artifacts/wet3camp-migration.sql` — run this in phpMyAdmin before deploying (creates platform_settings, rooms, etc.)

## Architecture decisions

- **Dual-DB CompatPool**: `db.ts` auto-detects MySQL (`mysql://` prefix) vs PostgreSQL. On PostgreSQL it translates MySQL syntax (backticks → double-quotes, GROUP_CONCAT → STRING_AGG, FIELD() → CASE, etc.)
- **RETURNING id guard**: Only appends `RETURNING id` to PostgreSQL INSERTs when `id` is NOT in the column list (auto-generated PKs only — avoids breaking key-value tables like `platform_settings`)
- **Upsert pattern**: Settings are saved with try-INSERT / catch-UPDATE instead of `ON DUPLICATE KEY UPDATE` to avoid MySQL-specific syntax issues across DB backends
- **Admin setup endpoint**: `POST /api/auth/setup-admin` — one-time admin creation, disabled after first use
- **Live deploy**: `cd /home/admin/wet3camp-build && git pull origin main && bash deploy-on-server.sh`

## Product

- Escort discovery with location, filters, gallery, reviews, and real-time online status
- Booking system with room marketplace
- Admin panel: escort approval, settings (SMTP, Telegram, API keys), connection testing
- Companion registration flow with OTP verification

## User preferences

- Live server: `wet3.camp` using MySQL database `admin_wet3camp`
- Deploy via PowerShell git push → server-side `git pull` + `deploy-on-server.sh`
- Always run `wet3camp-migration.sql` in phpMyAdmin before deploying new code

## Gotchas

- Run `wet3camp-migration.sql` in phpMyAdmin FIRST, then deploy code — migration creates `platform_settings` table which is required for admin settings to save
- The `CompatPool` adds `RETURNING id` only when `id` is not in the INSERT columns — key-value tables (`platform_settings`) have no `id` column and must not get `RETURNING id`
- `platform_settings` column is literally named `key` (a reserved word in both MySQL and PostgreSQL) — always quote it

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
