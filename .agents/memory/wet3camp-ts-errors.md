---
name: Wet3Camp pre-existing TypeScript errors
description: Non-blocking TS errors that existed before any edits — not regressions
---

## Pre-existing errors (do not treat as regressions)

- `Sidebar.tsx` lines 149/156/161/164/166 — `highlight`, `badge`, `badgeColor` property union type narrowing
- `admin.tsx` line 695 — BlogPost type assignment in AdminBlog's `setEditing()` call (optional fields on merged type)
- `exclusive.tsx` line 10 — Tier comparison case mismatch (`'Elite'` vs `'elite'`)

## Pattern
These errors are present in files that were not touched, or in sections of files not modified by the agent. Any new errors introduced by edits should be fixed; these pre-existing ones can be left.

**Why:** The Vite dev server and HMR handle these gracefully at runtime — they don't affect the running app.
