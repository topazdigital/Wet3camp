---
name: Profile analytics privacy
description: Rules for trustworthy visitor and contact analytics on claimed escort profiles.
---

Only record anonymous profile views and contact-button taps for active, claimed escort profiles. Do not backfill activity from before a profile is claimed. Store a hash of a short-lived random session identifier, not visitor identity or raw IP. Treat contact events as button taps, not confirmed messages or calls. Attribute city context only from the visitor's selected site search city; never infer or present precise location.

**Why:** Escorts need credible performance data, while unclaimed scraped profiles and inferred visitor locations should not be treated as consented or reliable analytics.

**How to apply:** Keep analytics owner-scoped and aggregated, explain each metric's limits in the UI, and avoid promises about traffic, leads, or search ranking.
