---
name: Social login and claim flow
description: Product expectations for social account creation and logged-out profile claims.
---

A visitor's first successful social sign-in creates a regular account; they do not need to register separately first. Claiming remains a separate ownership-verification and review process, and the visitor should return to the same profile after signing in or creating an account.

**Why:** The user wants social authentication to work for people without existing accounts and asked for a clearer logged-out claim flow.

**How to apply:** Preserve claim intent through provider callbacks and registration, and avoid forcing unrelated role selection before claim verification.
