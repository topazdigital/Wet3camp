---
name: Filtered dependency install
description: Dependency installation behavior for the imported Wet3Camp workspace
---

When preview dependencies are missing, install only the web and API workspace dependency graphs; a complete workspace install can hit package-firewall failures in the mobile/migration graph. If the filtered install is blocked on an old transitive package version, update its direct parent dependency to a current compatible version, then retry the filtered frozen install rather than adding a package override. Also compare the shared catalog range with the lockfile resolution: pnpm may skip resolution even when the locked version falls outside that range, so refresh to an in-range version within the existing major before trying a major upgrade.

**Why:** The firewall can reject a specific outdated artifact even when newer compatible releases are available; a parent update or catalog-compatible lock refresh resolves the stale pin while keeping the lockfile reproducible.

**How to apply:** Prefer `pnpm install --frozen-lockfile --filter '@workspace/wet3camp...' --filter '@workspace/api-server...'` before troubleshooting missing `vite` or `esbuild`; only update the blocking dependency chain when the install names a blocked version.