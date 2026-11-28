---
name: Safe-area CSS cascade
description: Cascade-layer ordering for installed-PWA safe-area custom properties.
---

Keep installed-PWA safe-area custom-property overrides outside lower-priority Tailwind component layers when the base variables are unlayered. Android standalone can overlay both system bars while reporting zero safe-area insets, so use bounded top and bottom fallbacks and keep the header's top allowance inside the header background.

**Why:** The page applied its installed-shell class, but mobile computed styles stayed at zero because unlayered root defaults outranked overrides inside a Tailwind layer. On Android, removing the fallback let the header and bottom tabs sit under system bars, while adding it to the root created a black band above the logo.

**How to apply:** When default `:root` tokens are unlayered, keep standalone/PWA overrides unlayered too, or move both defaults and overrides into consistently ordered layers. For Android standalone, place the top allowance inside the header, reserve the bottom system area in the tab bar, and offset floating controls by the same bottom inset plus the tab-bar height. Verify on device because a browser preview does not include Android system bars.
