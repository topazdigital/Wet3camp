---
name: Dynamic location SEO
description: Product rule for future city and area landing pages built from escort-provided locations.
---

**Rule:** Keep editorial location pages and add dynamic city/area pages from active, claimed profile locations. Only index a dynamic location once it has at least two eligible profiles; do not invent local details.

**Why:** The user wants locations added by profile owners to be discoverable, while avoiding thin or empty pages in search results.

**How to apply:** Keep the frontend directory, crawler-rendered HTML, and sitemap on the same active/claimed profile data and indexability threshold.

## Crawler metadata
The API's bot-rendered HTML must recognize `Google-InspectionTool` as well as `Googlebot`. Otherwise Search Console's inspection user-agent can receive the generic SPA shell and homepage canonical even while regular Googlebot gets the correct location metadata.

**Why:** Production testing showed different title/canonical output for these crawler user-agents.

**How to apply:** Verify title, canonical, and robots metadata for both user-agents after changes. A dev location with no profiles may correctly return `noindex`; confirm production eligibility against its live data.
