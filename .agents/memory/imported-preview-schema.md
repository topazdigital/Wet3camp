---
name: Imported preview schema
description: One-time database setup needed when an imported Wet3Camp workspace has no Replit dev tables
---

An imported workspace can start with an empty Replit PostgreSQL development database even when the API process starts successfully. Public API routes then fail with missing-table errors until the repository's existing development schema is applied.

**Why:** Import setup may not run the post-merge hook that normally initializes the development database, while production remains intentionally MySQL-backed.

**How to apply:** During first-run setup, apply the existing development schema to the Replit development database. Keep this separate from production MySQL migrations and do not change the application's production database policy.