---
name: Production route synchronization
description: How to handle route drift between the Wet3Camp checkout and the custom wet3.camp server
---

The custom wet3.camp server can continue serving an older API build even when the current checkout contains the route and the frontend calls it. For route-sensitive admin flows, verify the live endpoint after the GitHub Actions deployment completes, not only the local build.

**Why:** The admin photo mutation aliases existed in the checked-in Express router, but production returned Express `Cannot POST` 404 responses because the server had not received the current API build.

**How to apply:** Keep frontend and API changes in the same pushed release, confirm the API returns an auth response rather than 404 for protected routes, and treat a 404 as deployment drift before changing the client contract.