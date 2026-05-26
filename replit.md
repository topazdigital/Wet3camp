# Wet3 Camp

Kenya escort marketplace and booking platform — discover, book, and manage companion services.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/wet3camp run dev` — run the frontend (port 19099)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (Replit dev); MySQL on live server

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL (Replit) + MySQL (live wet3.camp) + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

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
