---
name: Wet3Camp stack
description: Stack summary and dev-environment fresh-import setup steps for Wet3Camp
---

MySQL/mysql2 (production), Express 5 (port 8080), React+Vite (port 5000 on Replit dev / 19099 documented), Expo mobile; JWT auth in localStorage as 'auth_token'.

**Fresh import / fresh dev DB setup:** After `pnpm install`, the Replit Postgres dev fallback DB starts empty. `migrate.ts` intentionally skips SQL migrations on Postgres (MySQL-only migrations), so the dev schema must be created manually once: `psql "$DATABASE_URL" -f scripts/init-pg-dev.sql`. Without this, `/api/escorts` and related routes 500 with `relation "escorts" does not exist`. No demo data is seeded — empty lists after setup are expected, not a bug.

**Why:** production is MySQL-only by design (see mysql-only.md); Postgres is a dev-only convenience DB with its own schema file that isn't wired into the automatic migration runner.
