---
name: Official Wet3Camp branding
description: User-approved wordmark and square brand mark for the Wet3Camp website.
---

**Rule:** The user designated the supplied horizontal Wet3Camp wordmark and separate square silhouette artwork as the official brand. Use the wordmark in shared headers and keep square favicon/app icons transparent outside the mark. Keep page accents consistent with the near-black, burgundy, and gold site palette.

**Why:** The user explicitly asked for these images to replace the previous marks across site pages and search-engine-facing metadata, and asked that inconsistent pages use the site colors.

**How to apply:** Keep the wordmark, transparent square PNG icons, Open Graph preview, PWA manifest, and JSON-LD logo URLs aligned; when regenerating icons, remove only the edge-connected white canvas and preserve internal highlights. Use burgundy #8B0000, gold #FFD700, and near-black #0A0A0A for shared UI; tier accents should stay within that palette. Do not revert to the earlier SVG or Flame marks.

## Legacy photo placeholder
`/logo-woman.png` is an outdated decorative image, not the current Wet3Camp logo. Use `/icon-512.png` as the square profile-image fallback; `/wet3camp-wordmark.png` remains the horizontal logo.

**Why:** The user corrected that the old illustration is not the current site logo and confirmed the logo and favicon were updated.

**How to apply:** Normalize existing `/logo-woman.png` profile values to `/icon-512.png` in API responses and exclude both placeholder images from uploaded-photo galleries.
