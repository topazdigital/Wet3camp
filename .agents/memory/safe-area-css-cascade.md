---
name: Safe-area CSS cascade
description: Cascade-layer ordering for installed-PWA safe-area custom properties.
---

Keep installed-PWA safe-area custom-property overrides outside lower-priority Tailwind component layers when the base variables are unlayered. Otherwise the installed-shell class can be present while computed inset variables still resolve to zero.

**Why:** The page applied its installed-shell class, but mobile computed styles stayed at zero because unlayered root defaults outranked overrides inside a Tailwind layer.

**How to apply:** When default `:root` tokens are unlayered, keep standalone/PWA overrides unlayered too, or move both defaults and overrides into consistently ordered layers. Verify computed top and bottom spacing at a mobile viewport; checking only the DOM class or build output misses this.
