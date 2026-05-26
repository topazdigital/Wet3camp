---
name: Wet3Camp stack
description: Core stack, ports, auth pattern, and key file locations for the Wet3Camp project
---

## Stack
- MySQL (not PostgreSQL) via mysql2
- Express 5 API server — port 8080 in dev
- React + Vite frontend — port 19099 in dev, BASE_PATH=/
- Expo mobile app (separate)
- JWT auth stored in localStorage as `auth_token`

## Key files
- Frontend pages: `artifacts/wet3camp/src/pages/`
- API routes: `artifacts/api-server/src/routes/`
- Static assets: `artifacts/wet3camp/public/`
- HTML entry: `artifacts/wet3camp/index.html`
- Escort data: `artifacts/wet3camp/src/data/escorts.ts`
- Blog data: `artifacts/wet3camp/src/data/blog.ts`

## Auth pattern
Frontend checks login via `useAuth()` → `isLoggedIn` boolean.
Token: `localStorage.getItem('auth_token')`

## API proxy
Vite proxies `/api/*` to `localhost:8080`.

**Why:** MySQL chosen over Postgres for the initial setup; do not assume Postgres/Drizzle patterns apply here.
