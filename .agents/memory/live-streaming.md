---
name: Live streaming system
description: How the live streaming feature works — in-memory SSE sessions, Jitsi embed, chat/reactions/gifts, no video storage
---

## Architecture
- **No video saved to DB** — streams are ephemeral (Jitsi p2p handles video)
- `artifacts/api-server/src/lib/live-store.ts` — in-memory Map of `LiveSession` objects keyed by escortId string
- `artifacts/api-server/src/routes/live.ts` — REST + SSE endpoints, registered in routes/index.ts BEFORE webrtcRouter

## Endpoints
- `GET /api/live` — list all active sessions (returns array)
- `GET /api/live/:escortId` — single session info + recent messages
- `POST /api/live/start` — escort starts stream; creates Jitsi room ID `wet3camp-live-{escortId}-{timestamp}`; returns `{ escortId, jitsiRoom, title, startedAt }`
- `POST /api/live/:escortId/end` — escort/admin ends stream; closes all SSE connections
- `GET /api/live/:escortId/events` — SSE stream; sends `init`, `chat`, `reaction`, `gift`, `viewer_count`, `pinned`, `ended`, `lock_change` events
- `POST /api/live/:escortId/chat` — send a chat message
- `POST /api/live/:escortId/react` — send emoji reaction (validated against allowed list)
- `POST /api/live/:escortId/gift` — send virtual gift (rose/diamond/crown/heart/fire/star/champagne/ring)
- `POST /api/live/:escortId/pin` — pin a message (escort only)
- `POST /api/live/:escortId/lock` — lock/unlock stream with optional tier requirement

## Frontend
- `/live` page (`artifacts/wet3camp/src/pages/live.tsx`) — shows real sessions from `/api/live`, polls every 15s; escorts see "Go Live" button → modal → POST /api/live/start → redirect to /live/:id?broadcast=true
- `/live/:escortId` page (`artifacts/wet3camp/src/pages/live-stream.tsx`) — Jitsi embed + chat sidebar; broadcaster mode via `?broadcast=true` query param; SSE for real-time chat/reactions/gifts/viewer count
- `my-profile.tsx` — Go Live Now button at top of Quick Actions for escort users

## City filter fix
`CITY_AREAS` mapping in `artifacts/api-server/src/routes/escorts.ts` — when filter=Nairobi, uses `LOWER(e.city) IN (?,?...)` with nairobi + all known Nairobi neighborhoods (Kilimani, Westlands, Roysambu, Hurlingham, etc.). Scraped escorts from nairobiraha.com may have city="Kilimani" instead of city="Nairobi" — the IN clause catches them.

**Why:** Scraped data from nairobiraha.com stores the neighborhood as the city field. The fix is in the query layer, not the data.
