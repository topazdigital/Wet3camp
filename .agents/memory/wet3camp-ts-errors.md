---
name: Wet3Camp pre-existing TypeScript errors
description: Non-blocking TS errors that existed before any edits — not regressions
---

## Pre-existing errors (do not treat as regressions)

- Web typecheck reports `Sidebar.tsx` optional `highlight`/`badge` union properties, `pending-approval.tsx` missing `approved` on `AuthCtx`, and `tier-benefits.tsx` optional `highlight` on benefit rows.
- API typecheck reports 31 errors across 11 existing files (including generic DB typing, implicit `any`, missing shared declarations, and return-path issues).
- Production builds pass despite these typecheck errors; changed profile/payment routes have no reported errors.

## Pattern
These errors are present in files that were not touched, or in sections of files not modified by the agent. Any new errors introduced by edits should be fixed; these pre-existing ones can be left.

**Why:** Both production bundlers complete successfully despite broader pre-existing typecheck failures; the changed subscription-removal routes have no reported type errors.
