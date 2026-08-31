---
name: Workflow port collision
description: The imported multi-artifact project can start both a combined workflow and a standalone API workflow.
---

If both the combined application workflow and the standalone API artifact workflow run together, they compete for port 8080. The frontend may still serve normally while the combined workflow logs an `EADDRINUSE` error for its API child.

**Why:** Replit can generate workflows for each registered artifact in addition to the original combined workflow, so restarting the combined workflow does not guarantee that its API child owns the port.

**How to apply:** When checking server-side changes, identify which API process owns port 8080, verify that process was rebuilt, and avoid treating the duplicate-workflow error as an application code failure.