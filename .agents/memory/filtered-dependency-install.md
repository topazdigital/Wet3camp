---
name: Filtered dependency install
description: Dependency installation behavior for the imported Wet3Camp workspace
---

When preview dependencies are missing, installing the complete workspace can fail on a package-firewall download from the mobile/migration graph. Installing only the web and API workspace dependency graphs restores the development preview without changing application structure.

**Why:** The imported workspace includes a separate Expo artifact and a broad lockfile; the web/API artifacts are sufficient for the primary preview and may have a clean cached dependency path.

**How to apply:** Prefer a frozen filtered install for `@workspace/wet3camp...` and `@workspace/api-server...` before troubleshooting application code when the preview reports missing `vite` or `esbuild`.