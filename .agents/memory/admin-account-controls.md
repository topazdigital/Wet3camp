---
name: Admin account controls
description: Production behavior and hosting constraint for admin view-as and account removal
---

## Rule
The linked-account admin view-as flow is confirmed working in the live Wet3Camp admin. On the Apache-fronted production site, admin `DELETE` requests are rejected with HTTP 406 before reaching Express; use authenticated `POST` aliases for account, escort, and deactivation actions.

**Why:** The user confirmed view-as works. A live request check returned Apache's HTML 406 response for admin DELETE paths, while POST paths reached Express and returned the API's authentication response.

**How to apply:** Keep admin removal controls on POST endpoints rather than DELETE for this hosting path. After backend changes, push to GitHub and separately perform the server deployment; verify a production POST reaches the API before testing an authenticated admin action.
