---
name: Filtered dependency install
description: Dependency installation behavior for the imported Wet3Camp workspace
---

When preview dependencies are missing, install only the web and API workspace dependency graphs; a complete workspace install can hit package-firewall failures in the mobile/migration graph. If the filtered install is blocked on an old transitive package version, update its direct parent dependency to a current compatible version, then retry the filtered frozen install rather than adding a package override.

**Why:** The firewall can reject a specific outdated artifact even when newer compatible releases are available; a parent update resolves the stale transitive pin while keeping the lockfile reproducible.

**How to apply:** Prefer `pnpm install --frozen-lockfile --filter '@workspace/wet3camp...' --filter '@workspace/api-server...'` before troubleshooting missing `vite` or `esbuild`; only update the blocking dependency chain when the install names a blocked version.