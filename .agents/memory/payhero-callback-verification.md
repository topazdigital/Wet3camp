---
name: PayHero callback verification
description: PayHero M-Pesa STK callback shape and transaction verification requirements.
---

PayHero's STK initiation response includes a provider `reference`. Its payment callback nests transaction fields under `response` (`ExternalReference`, `Amount`, `ResultCode`, and `Status`), while the root `status` can be a boolean. The transaction-status API accepts the initiation reference and reports the provider-side result.

**Why:** A flat-field callback parser can miss successful payments, and the callback endpoint is public. Granting a paid tier from the callback alone would allow forged activation attempts.

**How to apply:** Store the provider reference, parse nested callback fields, match the reported amount to the pending payment, and verify provider status server-side before applying a tier. Keep the settlement idempotent.
