# Wet3 Camp

A premium booking platform for exclusive adult services in Kenya, with browsing, profiles, live feeds, and admin management.

## Run & Operate

- `pnpm --filter @workspace/wet3camp run dev` — run the frontend (Vite)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite (artifacts/wet3camp)
- Routing: wouter
- API: Express 5 (artifacts/api-server)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Styling: Tailwind CSS v4 with custom dark theme
- UI Components: shadcn/ui

## Where things live

- `artifacts/wet3camp/src/` — React frontend source
- `artifacts/wet3camp/src/pages/` — Route-level page components (home, admin, feeds, live, etc.)
- `artifacts/wet3camp/src/components/` — Shared components (Header, Sidebar, BottomNav, FeaturedCarousel, etc.)
- `artifacts/wet3camp/src/lib/sidebar-context.tsx` — Custom sidebar state context
- `artifacts/wet3camp/src/index.css` — Global CSS with custom dark theme variables
- `artifacts/api-server/src/` — Express API server
- `lib/api-spec/openapi.yaml` — API contract source of truth

## Architecture decisions

- Migrated from Next.js to Vite + React (wouter for routing) — Next.js is not supported as a Replit artifact type.
- All Next.js `Link` → wouter `Link`, `usePathname` → `useLocation`, `'use client'` directives removed.
- Custom dark theme colors defined as CSS custom properties (`--dark-bg`, `--card-bg`, `--text-light`, etc.) and exposed as Tailwind utility classes in `@layer components`.
- Sidebar state managed via custom `SidebarProvider` in `lib/sidebar-context.tsx` (not shadcn sidebar).
- All data is mock/static — no backend integration yet. API server exists but is not wired to frontend.

## Product

- Home page: Featured carousel of profiles + infinite scroll grid
- 18 routes: Home, Live, Feeds, Exclusive, Shop, Adverts, Events, Videos, Rooms, Tours, Reviews, Blacklist, Testimonials, FAQs, Messages, Contact, Admin, Install
- Admin panel: moderator management with role-based access levels
- Responsive: desktop sidebar + mobile bottom nav

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Do NOT run `pnpm dev` or `pnpm run dev` at the workspace root — no root dev script.
- The sidebar uses a custom `useSidebar` from `@/lib/sidebar-context`, NOT the shadcn `useSidebar` from `@/components/ui/sidebar`.
- Tailwind v4 — no `tailwind.config.js`; all theming done via CSS custom properties in `index.css`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
