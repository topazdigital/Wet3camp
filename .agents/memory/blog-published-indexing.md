---
name: Published blog indexing
description: Blog sitemap entries and crawler metadata must correspond to published database posts.
---

Only published `blog_posts` rows are canonical blog URLs. Legacy hard-coded slugs can remain in crawler metadata after their article is unpublished, making the HTML route look live while `/api/blog/:slug` returns 404. Use `updated_at` for sitemap `lastmod`, falling back to `published_at`; omit `lastmod` if neither is available.

**Why:** On 2026-11-06, all 15 legacy sitemap slugs returned 404 from the public article API even though crawler HTML returned 200.

**How to apply:** When changing blog SEO, validate article API routes and source sitemap entries from published database rows; do not let static metadata make missing or unpublished posts indexable.
