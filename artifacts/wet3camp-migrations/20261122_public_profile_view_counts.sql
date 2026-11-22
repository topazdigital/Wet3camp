-- Count every public profile open without retaining visitor-level data.
-- Views begin accruing from deployment; existing event analytics are not backfilled.
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `views_count` bigint(20) unsigned NOT NULL DEFAULT 0;
