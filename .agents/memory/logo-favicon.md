---
name: Logo and favicon design
description: Custom woman-silhouette SVG logo for Wet3Camp; header/sidebar use img tag not Flame icon
---

## Rule
`favicon.svg` and `icon.svg` in `artifacts/wet3camp/public/` are hand-crafted SVGs showing a golden female silhouette (head, wavy hair, shoulders, crown sparkle, heart detail) on a very dark red/black background. Do NOT replace them with a plain icon or revert to the old Flame icon.

## Header / Sidebar logo
Both `Header.tsx` and `Sidebar.tsx` use:
```jsx
<div className="w-8 h-8 rounded-lg overflow-hidden shadow-md flex-shrink-0">
  <img src="/favicon.svg" alt="Wet3Camp" className="w-full h-full object-cover" />
</div>
```
The `Flame` import from lucide-react has been removed from both files.

**Why:** User explicitly asked for a "hot lady icon before the name" — the woman-silhouette SVG is the brand mark.

**How to apply:** Any future logo change should update `favicon.svg` (180×180) and `icon.svg` (512×512) together, and re-check Header.tsx + Sidebar.tsx reference the same file.
