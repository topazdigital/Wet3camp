---
name: Tier ordering protocol
description: Tier priority and freshness ordering for Wet3Camp profile lists.
---

## Rule

Order profile tiers as Elite, VIP, Premium, Standard, then Free. On lists that
highlight recently added profiles, keep the newest-first order within each tier.
Do not let city grouping or random rotation move newer profiles below older
profiles of the same tier.

**Why:** The user confirmed that paid tiers should remain prioritized while
new profiles should be easy to find within their tier.

**How to apply:** Keep tier ordering on the homepage and search surfaces. When a
surface requests newest profiles, preserve the API's newest-first order inside
each tier; leave admin ordering unchanged unless asked.
