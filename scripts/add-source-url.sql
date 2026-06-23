-- ============================================================
-- add-source-url.sql
-- Run in phpMyAdmin on admin_wet3camp BEFORE deploying
-- Adds source_url column so the scraper can track & re-fetch profiles
-- This script is idempotent — safe to run multiple times
-- ============================================================

-- 1. Add source_url column to escorts table
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS source_url VARCHAR(500) DEFAULT NULL;

-- 2. Also ensure other scraper columns exist (safe to run even if already present)
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS source_site VARCHAR(100) DEFAULT NULL;

ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS incall TINYINT NOT NULL DEFAULT 0;

ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS outcall TINYINT NOT NULL DEFAULT 0;

ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS price_incall INT DEFAULT 0;

ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS price_outcall INT DEFAULT 0;

ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS price_overnight INT DEFAULT 0;

-- Done — now run the scraper to populate real data:
--
--   cd /home/admin/wet3camp-build/artifacts/api-server
--   DATABASE_URL="mysql://admin_wet3camp:YOUR_PASSWORD@localhost/admin_wet3camp" \
--     node scrape-escorts.mjs --fast
--
-- To re-fetch services/languages/rates for already-imported escorts:
--   DATABASE_URL="mysql://admin_wet3camp:YOUR_PASSWORD@localhost/admin_wet3camp" \
--     node scrape-escorts.mjs --update
