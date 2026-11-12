---
name: Social login and claim flow
description: Product expectations for social account creation and logged-out profile claims.
---

A visitor's first successful social sign-in creates a regular account; they do not need to register separately first. Claiming remains a separate ownership-verification and review process, and the visitor should return to the same profile after signing in or creating an account.

**Why:** The user wants social authentication to work for people without existing accounts and asked for a clearer logged-out claim flow.

**How to apply:** Preserve claim intent through provider callbacks and registration, and avoid forcing unrelated role selection before claim verification.

When someone selects Client or Escort in registration before choosing a social provider, carry that choice through the signed OAuth state. Apply it only to a newly created account; an existing account's saved role remains authoritative. New Escort accounts continue to profile setup after the callback. Social sign-in started without a selected role can still use the role chooser.

**Why:** The user expects registration to remember the account type already selected, without silently changing existing accounts.

**How to apply:** Validate the selected role before adding it to OAuth state for Google, Facebook, or Apple, then use it only when creating the account.

Password reset must also work for accounts created through Google, Facebook, or Apple. A user who resets their password should be able to sign in with that account's email and the new password while keeping social sign-in available.

**Why:** The user explicitly expects social-login accounts to be able to set and use a password.

**How to apply:** Keep provider-created accounts on the same `users` record and update the shared password hash used by email/password login during reset.

Social sign-in buttons should appear only for providers whose complete credentials are saved in admin settings. Apply this to sign-in, registration, and claim flows; the public config endpoint may return readiness flags and a public client ID, never provider secrets.

**Why:** The user wants Facebook and other social login choices hidden until their credentials have been configured in admin.

**How to apply:** Derive readiness server-side from each provider's required settings, disable caching for the public config response, and hide each unavailable provider in every frontend entry point.

An escort who already manages a profile can request to claim another listing without creating another escort account. Admin verifies the second claim; approval merges the duplicate into the existing profile, which remains canonical, and preserves the profile data and activity.

**Why:** The user chose duplicate merging to handle an escort who discovers a second listing of their own.

**How to apply:** Keep the existing managed profile primary, require review before merging, retain the source listing as an archived redirect, and include its associated activity in the canonical profile.
