---
name: Production API port
description: Wet3Camp shares a DirectAdmin server with other PM2 applications.
---

The production API cannot assume port 8080 is available. Another PM2 application already binds that port, so Wet3Camp needs its own loopback port and Apache must proxy API, crawler, and frontend asset requests to the same port.

**Why:** Restarting the Wet3Camp PM2 process on 8080 produced repeated `EADDRINUSE` failures and left Apache serving an older backend.

**How to apply:** Keep the dedicated port in the server deploy configuration, generate `.htaccess` from that port, and validate the published assets and API after each deployment.