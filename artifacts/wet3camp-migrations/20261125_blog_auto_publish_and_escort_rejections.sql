-- Preserve explicit escort approval outcomes and publish the existing imported blog drafts.
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `approval_status` varchar(20) DEFAULT NULL;

UPDATE blog_posts
SET published = 1,
    updated_at = CURRENT_TIMESTAMP
WHERE published = 0
  AND source_url IS NOT NULL
  AND TRIM(source_url) <> '';
