---
name: Profile analytics privacy
description: Public pageview totals and privacy boundaries for visitor and contact analytics.
---

Count every public open of an active profile in its aggregate `views_count`, including unclaimed imported profiles. Do not store visitor-level data for those public totals. Keep detailed profile and contact analytics limited to active, claimed profiles; keep contact events labeled as button taps, not confirmed messages or calls. For detailed events, store a hash of a short-lived random session identifier, not visitor identity or raw IP. Attribute city context only from the visitor's selected site search city; never infer or present precise location.

**Why:** The user wants public totals to count every time any active profile is opened, while detailed owner analytics still require a claimed profile and should not expose identifiable visitor data.

**How to apply:** Increment the public aggregate once per profile open for all active listings. Keep source, city, and contact-event analytics claim-scoped, preserve the event de-duplication rule for owner reports, and avoid promises about traffic, leads, or search ranking.
