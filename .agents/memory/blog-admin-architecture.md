---
name: Blog admin architecture
description: Admin blog CRUD writes through the backend API/DB, not localStorage; inline media + fast-index conventions
---

The admin Blog editor previously read/wrote posts via client-side `localStorage`
(`getBlogPosts`/`saveBlogPosts` in `data/blog.ts`), while the public blog pages and
Google both read from the backend `blog_posts` table via `/api/blog`. This meant
admin edits never actually reached other visitors or crawlers.

**Fix applied:** `AdminBlog` in `admin.tsx` now uses real admin-authenticated
endpoints (`GET/POST/PUT/DELETE /api/admin/blog[/:id]`, `PATCH /api/admin/blog/:id/publish`)
that write straight to `blog_posts`. Do not reintroduce localStorage as the
source of truth for blog content — it's invisible to both other users and search bots.

**Inline media convention:** content is plain text with markdown-ish tokens on
their own line: `![alt](url)` for images, `[video](url)` for video. The admin
editor's "Insert Image/Video" toolbar uploads via `POST /api/upload` (type:
`'blog'`, admin-only, accepts video up to 80MB) and inserts the token at the
textarea cursor. `blog-post.tsx`'s line-based renderer matches these tokens and
renders real `<img>`/`<video>` elements inline (not just a single cover image).

**Fast indexing:** publishing/updating a published post server-side calls
`submitToIndexNow([blogPostUrl(slug)])` (from `routes/sitemap.ts`) to instantly
ping Bing/Yandex — Google does not support IndexNow, so for Google the only
practical fast-track is the existing `sitemap-blog.xml` (already dynamic from
DB) plus `ogPreviewMiddleware`'s per-post bot-served HTML/JSON-LD.

**Why:** without this, "publishing via admin" silently only affected the
admin's own browser — a real pre-existing bug, not just a missing feature.
