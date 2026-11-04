---
name: Dynamic location SEO
description: Product rule for future city and area landing pages built from escort-provided locations.
---

**Rule:** Keep editorial location pages and add dynamic city/area pages from active, claimed profile locations. Only index a dynamic location once it has at least two eligible profiles; do not invent local details.

**Why:** The user wants locations added by profile owners to be discoverable, while avoiding thin or empty pages in search results.

**How to apply:** Keep the frontend directory, crawler-rendered HTML, and sitemap on the same active/claimed profile data and indexability threshold.

## Crawler metadata
Both the API's bot renderer and Apache's rewrite allowlist must recognize `Google-InspectionTool` as well as `Googlebot`. An API-only change is insufficient: Apache can send the inspection user-agent to the generic SPA shell before the API sees it.

**Why:** Production testing showed that Googlebot received location metadata while Google-InspectionTool received the homepage canonical; the deployment log confirmed the API was updated but Apache still had a narrower allowlist.

**How to apply:** Keep both user-agent gates aligned and verify title, canonical, and robots metadata for both user-agents after deployment. A dev location with no profiles may correctly return `noindex`; confirm production eligibility against its live data.
