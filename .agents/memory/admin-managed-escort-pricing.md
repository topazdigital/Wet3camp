---
name: Admin-managed escort pricing
description: Product decision for advertised profile-tier prices and featured placement checkout.
---

The escort advertising and tier pages use prices managed in Admin. Featured placement prices are the source of truth for the matching M-Pesa charge; stale or altered amounts must not be charged. Account subscription plans are a separate product and remain unchanged by these prices.

**Why:** The user wants to adjust offers in Admin without code changes and chose to have featured checkout follow the advertised price.

**How to apply:** Keep the advertised featured amounts and featured payment validation on the same saved configuration. Do not map profile-tier display amounts onto the separate account subscription plans without explicit direction.
