---
name: Wet3Camp stack
description: Core stack, ports, auth pattern, and key file locations for the Wet3Camp project
---

## Stack
- MySQL (not PostgreSQL) via mysql2
- Express 5 API server — port 8080 in dev
- React + Vite frontend — port 19099 in dev, BASE_PATH=/
- Expo mobile app (separate)
- JWT auth stored in localStorage as `w3c_token` (set via `setToken()` in `api.ts`)

## Key files
- Frontend pages: `artifacts/wet3camp/src/pages/`
- API routes: `artifacts/api-server/src/routes/`
- Static assets: `artifacts/wet3camp/public/`
- HTML entry: `artifacts/wet3camp/index.html`
- Escort data (static/fake — DO NOT USE for real data): `artifacts/wet3camp/src/data/escorts.ts`
- Blog data: `artifacts/wet3camp/src/data/blog.ts`

## Auth pattern
Frontend checks login via `useAuth()` → `isLoggedIn` boolean.
Token key in localStorage: `w3c_token` (defined in `api.ts` TOKEN_KEY).
All manual `localStorage.getItem(...)` calls for auth token MUST use `w3c_token`.
Using `wet3camp_token`, `auth_token`, or `token` as keys will always return null.

**Why:** There was a token key mismatch where `adminFetch` in admin.tsx used `wet3camp_token` 
and bookings.tsx used `auth_token` — both silently failed with 401 until corrected to `w3c_token`.

## API proxy
Vite proxies `/api/*` to `localhost:8080`.

## Profile data pattern
- GET `/api/profile/escort` — returns current logged-in escort's profile (added)
- GET `/api/profile` — returns current logged-in user's basic info (added)
- PATCH `/api/profile` — updates name/phone/avatar
- PATCH `/api/profile/escort` — updates all escort fields
- `my-profile.tsx` uses `api.profile.getEscort()` on mount to pre-fill edit form

## Fake escort removal
Admin panel → Escorts tab → "Delete Fakes" button calls `DELETE /api/admin/cleanup-seed-escorts`.
This deletes all escorts where `user_id IS NULL` (seed/demo data with no real user account).

**Why:** Seed data was inserted without user_id. Any escort without a linked user account is fake.
