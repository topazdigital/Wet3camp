---
name: Static asset deploy validation
description: Production uses Apache SPA fallback alongside Vite hashed assets.
---

A missing hashed JavaScript or CSS file must fail the deployment instead of falling through to the SPA `index.html`. Returning HTML for a module request produces a white screen for fresh browsers, while users with cached bundles can appear unaffected.

**Why:** The production web root can briefly contain a new HTML manifest without its matching asset tree after a partial or failed copy.

**How to apply:** Copy the complete Vite output, verify `index.html` exists, verify every `/assets/` path referenced by `src` or `href` exists and is non-empty, and smoke-test the published JavaScript response `Content-Type`.

For this shared server, stage the complete frontend and API runtime trees in fresh sibling directories, validate them, then atomically rename them into their stable live paths. Do not copy over existing release contents in place.

**Why:** Existing files under the Apache and Node release paths can be owned by another server user; in-place cleanup or recursive copy can fail even when the release parent is writable.

**How to apply:** Use same-filesystem directory swaps, keep the stable paths used by Apache and PM2, and retain the asset-manifest and JavaScript content-type checks before considering the deployment successful.