---
name: Admin account controls
description: Production behavior and hosting constraint for admin view-as and account removal
---

## Rule
The linked-account admin view-as and permanent-delete flows are confirmed working in the live Wet3Camp admin. On the Apache-fronted production site, admin `DELETE` requests are rejected with HTTP 406 before reaching Express; use authenticated `POST` aliases for account, escort, and deactivation actions.

**Why:** The user confirmed both view-as and deletion work. A live request check returned Apache's HTML 406 response for admin DELETE paths, while POST paths reached Express and returned the API's authentication response.

**How to apply:** Keep admin removal controls on POST endpoints rather than DELETE for this hosting path. After backend changes, push to GitHub and separately perform the server deployment; verify a production POST reaches the API before testing an authenticated admin action.

## Reversible user status
The Registered Users admin list must let administrators reactivate inactive accounts as well as deactivate active accounts. Deactivation should not remove the row from the current list, so it can be reactivated immediately.

**Why:** The user asked how to restore an account after deactivating it and confirmed that active status is managed in the admin panel.

**How to apply:** Keep both actions admin-only, use POST routes for Apache compatibility, and update the visible row only after the API confirms the status change.

## Escort profile editing
Production Apache can return HTTP 406 for the admin escort edit `PATCH` request. The edit form should use an authenticated POST update alias; keep the `PATCH` route only for API compatibility if needed.

**Why:** The user received a 406 when saving changes in the escort editor, while the server-side update handler already existed.

**How to apply:** Keep `requireAuth` and `requireAdmin` on the POST alias, send the same validated edit fields, and update the admin list only after the server returns the saved escort.
