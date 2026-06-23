-- ============================================================
-- Seed services and languages for existing escorts (MySQL)
-- Run this in phpMyAdmin on admin_wet3camp database
-- Safe to re-run — uses INSERT IGNORE
-- ============================================================

-- Step 1: Seed standard services for all active escorts that have none yet
INSERT IGNORE INTO escort_services (escort_id, name, available)
SELECT e.id, svc.name, 1
FROM escorts e
CROSS JOIN (
  SELECT 'Oral Sex'        AS name UNION ALL
  SELECT 'GFE'             UNION ALL
  SELECT 'Massage'         UNION ALL
  SELECT 'Kissing'         UNION ALL
  SELECT 'Role Play'       UNION ALL
  SELECT 'Threesome'       UNION ALL
  SELECT 'Anal Sex'        UNION ALL
  SELECT 'BDSM'            UNION ALL
  SELECT 'Striptease'      UNION ALL
  SELECT 'Foot Fetish'     UNION ALL
  SELECT 'Domination'      UNION ALL
  SELECT 'Submission'      UNION ALL
  SELECT 'Outcall'         UNION ALL
  SELECT 'Incall'          UNION ALL
  SELECT 'Overnight'       UNION ALL
  SELECT 'Video Call'
) svc
WHERE e.is_active = 1
  AND NOT EXISTS (
    SELECT 1 FROM escort_services es WHERE es.escort_id = e.id
  );

-- Step 2: Seed English + Swahili for all active escorts that have no languages yet
INSERT IGNORE INTO escort_languages (escort_id, language)
SELECT e.id, lang.language
FROM escorts e
CROSS JOIN (
  SELECT 'English' AS language UNION ALL
  SELECT 'Swahili'
) lang
WHERE e.is_active = 1
  AND NOT EXISTS (
    SELECT 1 FROM escort_languages el WHERE el.escort_id = e.id
  );

-- Step 3: Seed realistic rates for escorts that have all-zero pricing
UPDATE escorts
SET
  price_incall          = FLOOR(2000 + RAND() * 8000),
  price_outcall         = FLOOR(3000 + RAND() * 10000),
  price_incall_overnight  = FLOOR(8000 + RAND() * 12000),
  price_outcall_overnight = FLOOR(10000 + RAND() * 15000)
WHERE is_active = 1
  AND (price_incall = 0 OR price_incall IS NULL)
  AND (price_outcall = 0 OR price_outcall IS NULL);

SELECT CONCAT('Services seeded for escorts: ', COUNT(DISTINCT escort_id)) AS result FROM escort_services;
SELECT CONCAT('Languages seeded for escorts: ', COUNT(DISTINCT escort_id)) AS result FROM escort_languages;
SELECT CONCAT('Escorts with rates: ', COUNT(*)) AS result FROM escorts WHERE price_incall > 0 AND is_active = 1;
