---
name: Real-data fixes batch
description: Summary of all mock/hardcoded data removals and real-data wiring applied before go-live
---

## Rules applied

**Standard tier is FREE** (not KES 500). Changed in `artifacts/wet3camp/src/pages/tier-benefits.tsx`. Admin can set prices for paid tiers.

**Own profile detection** in `profile.tsx`:
- Get `user` from `useAuth()` (not just `isLoggedIn`)
- `isOwnProfile = !!(user?.id && escort.user_id && String(escort.user_id) === user.id)`
- escorts route uses `SELECT *` so `user_id` is always returned
- When own profile: hide Follow/Favorite/Book buttons, show "Edit My Profile" link instead

**Three new GET endpoints** added to `artifacts/api-server/src/routes/profile.ts`:
- `GET /api/profile/escort/earnings` — real data from bookings table (thisMonth, lastMonth, total, weeklyChart)
- `GET /api/profile/escort/followers` — real data from followers table (total, thisWeek, recent[])
- `GET /api/profile/escort/subscription` — reads from subscriptions table (active, plan, expiresAt)

**Incall/Outcall pricing** added:
- PATCH /profile/escort now accepts `rateIncall`, `rateOutcall` → updates `price_incall`, `price_outcall`
- my-profile.tsx has `editIncall`/`editOutcall` state, populated from escortProfile, saved in handleSave
- Edit Profile → Pricing section now has 5 fields (hourly, overnight, video, incall, outcall)

**OTP security fix**: When SMTP not configured, `/auth/send-otp` returns HTTP 503 ("Email service not configured"). Previously it returned the OTP code in the JSON response (demo mode leak). Never add demo mode back.

**Instagram Import**: Shows honest "not configured" panel with link to Gallery tab. No fake Unsplash photos.

**Profile completion**: Calculated dynamically from real escortProfile fields (bio 20%, city+area 10%, gallery 30%, contacts 20%, languages 10%, services 10%).

**Why:**
All of these were mock/hardcoded before go-live. The user needed real data or honest "not configured" states before launching to real users.
