---
name: Shell secret refresh
description: Replit Shell sessions can retain an environment snapshot from before a secret is added
---

When a secret is added or renamed in Replit, an already-open Shell session may
not see it even though the workspace secret inventory confirms it exists.

**Why:** Shell processes inherit environment variables when the session starts;
adding a secret later does not reliably update that running process.

**How to apply:** Close/reopen the Replit Shell (or start a fresh terminal),
check availability without printing the value, then rerun the command that
needs the secret.