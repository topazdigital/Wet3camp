---
name: Server deploy self-update
description: Shared-host deployment behavior when the deploy script updates its own checkout
---

When a server deploy script pulls and resets the repository containing the script itself, the current Bash process can continue executing stale deployment logic. A stale run may stop before PM2 startup even though the checkout reports the latest commit.

**Why:** The live server showed an older PM2 failure path after pulling a newer checkout, leaving Apache with a static shell but no working API.

**How to apply:** Re-exec the freshly checked-out script exactly once after the reset, avoid treating the current PID as a concurrent deploy, and verify the API health endpoint on the dedicated loopback port before declaring deployment complete.