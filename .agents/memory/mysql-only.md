---
name: MySQL-only production rule
description: Production uses MySQL/MariaDB only. Replit PostgreSQL is dev-only fallback. Never add pg-specific SQL to app code.
---

## Rule
MySQL / MariaDB is the ONLY production database at wet3.camp (`admin_wet3camp` on MariaDB 10.6).

Replit provides a built-in PostgreSQL database used ONLY so the app runs in Replit. It is NOT a migration target.

## CompatPool pattern
`artifacts/api-server/src/lib/db.ts` exports `getPool()` returning a `CompatPool | null`.

CompatPool auto-detects `mysql://` vs `postgres://` DATABASE_URL and translates MySQL syntax on the fly (backticks→quotes, GROUP_CONCAT→STRING_AGG, FIELD()→CASE, etc.).

All queries use MySQL syntax. The CompatPool translates for PostgreSQL at runtime.

Query result pattern (always use this, not pg-style):
```typescript
const [rows] = await pool.query<any[]>(sql, params)           // array of rows
const [[singleRow]] = await pool.query<any[]>(sql, params)    // first row
```

## What to never do
- Never add `RETURNING id` or `::cast` syntax to application SQL
- Never import `pg` package; mysql2 is already installed
- Never rewrite MySQL SQL to pg syntax
- Never run `scripts/setup-pg-schema.sql` — it only exists for Replit dev bootstrap

**Why:** The owner explicitly stated MySQL is permanent and intentional. Production at wet3.camp runs MariaDB 10.6. Any pg-specific code would break production silently.

**How to apply:** Any time you write a SQL query, write it in MySQL syntax. Trust CompatPool to handle the Replit dev translation automatically.
