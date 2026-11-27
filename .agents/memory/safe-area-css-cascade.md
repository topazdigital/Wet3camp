---
name: Safe-area CSS cascade
description: Cascade-layer ordering for installed-PWA safe-area custom properties.
---

Keep installed-PWA safe-area custom-property overrides outside lower-priority Tailwind component layers when the base variables are unlayered. Android standalone can also overlay its status bar while reporting a zero `safe-area-inset-top`, so retain a small top-only fallback; do not assume the bottom inset is the same size.

**Why:** The page applied its installed-shell class, but mobile computed styles stayed at zero because unlayered root defaults outranked overrides inside a Tailwind layer. After the forced inset was removed, the live Android app placed the header under the OS status bar even though the browser version was fine.

**How to apply:** When default `:root` tokens are unlayered, keep standalone/PWA overrides unlayered too, or move both defaults and overrides into consistently ordered layers. Use a conservative top fallback only for installed Android layouts; rely on the actual bottom inset and separately position floating controls above the tab bar. Verify both the CSS value and the device screenshot because a browser preview does not include Android system bars.
