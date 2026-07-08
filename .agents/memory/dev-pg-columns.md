---
name: Dev PostgreSQL extra columns
description: Columns and tables added to dev PostgreSQL that are already in wet3camp-migration.sql for MySQL
---

## Rule
The dev PostgreSQL `escorts` table needs these extra columns that the API route references:
- `gender` VARCHAR(20) DEFAULT 'Female'
- `instagram` VARCHAR(100)
- `facebook` VARCHAR(100)
- `price_incall` INTEGER NOT NULL DEFAULT 0
- `price_outcall` INTEGER NOT NULL DEFAULT 0
- `price_incall_overnight` INTEGER NOT NULL DEFAULT 0
- `price_outcall_overnight` INTEGER NOT NULL DEFAULT 0
- `source_site` VARCHAR(100)
- `incall` SMALLINT NOT NULL DEFAULT 1
- `outcall` SMALLINT NOT NULL DEFAULT 1

Also added tables:
- `profile_claims` — for the claims route (`artifacts/api-server/src/routes/claims.ts`)
- `user_follows` — for the follow system

**Why:** The MySQL live server and `wet3camp-migration.sql` already have these columns; the dev PostgreSQL previously lacked them causing column-not-found errors.

**How to apply:** If spinning up a fresh dev PostgreSQL DB, run `wet3camp-migration.sql` translated through CompatPool, OR manually apply the ALTER TABLE statements above.

## Fresh import / fresh dev DB checklist
The API server intentionally skips SQL migrations on Postgres — schema setup is a separate manual/deploy step, not automatic on server start. On a brand-new dev Postgres instance, `pnpm install` alone leaves all tables missing, causing "relation does not exist" 500s on every route.

**How to apply:** Run `scripts/init-pg-dev.sql` against `$DATABASE_URL` before first start. If new tables get added to the MySQL migration (`wet3camp-migration.sql`) they can lag behind in this dev-only script — check for parity if a new 42P01 error appears.
