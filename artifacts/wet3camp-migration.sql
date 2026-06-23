-- =============================================================================
-- Wet3.camp — Database Migration SQL (v4)
-- Run automatically by deploy-on-server.sh on every deploy.
-- Every statement uses IF NOT EXISTS / IGNORE — 100% safe to re-run.
-- =============================================================================

-- =============================================================================
-- 1. Create users table (required for all auth)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            int(10) UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`      varchar(100)        NOT NULL,
  `email`         varchar(255)        NOT NULL,
  `password_hash` varchar(255)        NOT NULL,
  `display_name`  varchar(150)        DEFAULT NULL,
  `phone`         varchar(30)         DEFAULT NULL,
  `role`          varchar(20)         NOT NULL DEFAULT 'user',
  `avatar`        varchar(500)        DEFAULT NULL,
  `is_active`     tinyint(1)          NOT NULL DEFAULT 1,
  `created_at`    datetime            NOT NULL DEFAULT current_timestamp(),
  `updated_at`    datetime            NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_email`    (`email`),
  UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 2. Create escorts table (full schema)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `escorts` (
  `id`               int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          int(10) UNSIGNED DEFAULT NULL,
  `name`             varchar(100)     NOT NULL,
  `age`              tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `city`             varchar(100)     NOT NULL DEFAULT '',
  `area`             varchar(100)     NOT NULL DEFAULT '',
  `lat`              decimal(9,6)     NOT NULL DEFAULT 0.000000,
  `lng`              decimal(9,6)     NOT NULL DEFAULT 0.000000,
  `tier`             enum('elite','vip','premium','standard','free') NOT NULL DEFAULT 'standard',
  `rating`           decimal(2,1)     NOT NULL DEFAULT 0.0,
  `reviews_count`    smallint(5) UNSIGNED NOT NULL DEFAULT 0,
  `bio`              text             DEFAULT NULL,
  `image`            varchar(500)     DEFAULT NULL,
  `height`           varchar(20)      DEFAULT NULL,
  `body_type`        varchar(50)      DEFAULT NULL,
  `ethnicity`        varchar(50)      DEFAULT NULL,
  `hair_color`       varchar(50)      DEFAULT NULL,
  `gender`           varchar(30)      NOT NULL DEFAULT 'Female',
  `price_hourly`     int(10) UNSIGNED NOT NULL DEFAULT 0,
  `price_overnight`  int(10) UNSIGNED NOT NULL DEFAULT 0,
  `price_video`      int(10) UNSIGNED NOT NULL DEFAULT 0,
  `price_incall`     int(10) UNSIGNED NOT NULL DEFAULT 0,
  `price_outcall`    int(10) UNSIGNED NOT NULL DEFAULT 0,
  `whatsapp`         varchar(20)      DEFAULT NULL,
  `telegram`         varchar(100)     DEFAULT NULL,
  `phone`            varchar(20)      DEFAULT NULL,
  `available`        tinyint(1)       NOT NULL DEFAULT 0,
  `verified`         tinyint(1)       NOT NULL DEFAULT 0,
  `online`           tinyint(1)       NOT NULL DEFAULT 0,
  `is_active`        tinyint(1)       NOT NULL DEFAULT 1,
  `created_at`       datetime         NOT NULL DEFAULT current_timestamp(),
  `updated_at`       datetime         NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_city`    (`city`),
  KEY `idx_tier`    (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Safe column additions for existing installs
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `is_active`       tinyint(1)       NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS `online`          tinyint(1)       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `lat`             decimal(9,6)     NOT NULL DEFAULT 0.000000,
  ADD COLUMN IF NOT EXISTS `lng`             decimal(9,6)     NOT NULL DEFAULT 0.000000,
  ADD COLUMN IF NOT EXISTS `height`          varchar(20)      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `body_type`       varchar(50)      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `ethnicity`       varchar(50)      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `hair_color`      varchar(50)      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `gender`          varchar(30)      NOT NULL DEFAULT 'Female',
  ADD COLUMN IF NOT EXISTS `price_hourly`    int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `price_overnight` int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `price_video`     int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `price_incall`    int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `price_outcall`   int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `whatsapp`               varchar(20)      DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `telegram`               varchar(100)     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `featured`               tinyint(1)       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `instagram`              varchar(100)     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `facebook`               varchar(100)     DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `price_incall_overnight`  int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `price_outcall_overnight` int(10) UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `incall`      tinyint(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `outcall`     tinyint(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `source_site` varchar(100)          DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `source_url`  varchar(500)          DEFAULT NULL;

-- =============================================================================
-- 3. Create platform_settings table (Admin → Settings & API Keys tabs)
--    REQUIRED for admin settings save/load to work.
-- =============================================================================
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `key`        varchar(100)  NOT NULL,
  `value`      text          NOT NULL DEFAULT '',
  `updated_at` datetime      NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. Create escort_gallery table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `escort_gallery` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `escort_id`   int(11)      NOT NULL,
  `image_url`   varchar(500) NOT NULL,
  `sort_order`  int(11)      NOT NULL DEFAULT 0,
  `created_at`  datetime     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. Create escort_languages table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `escort_languages` (
  `id`         int(11)     NOT NULL AUTO_INCREMENT,
  `escort_id`  int(11)     NOT NULL,
  `language`   varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_escort_lang` (`escort_id`, `language`),
  KEY `idx_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 6. Create escort_services table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `escort_services` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `escort_id`  int(11)      NOT NULL,
  `name`       varchar(100) NOT NULL,
  `available`  tinyint(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_escort_svc` (`escort_id`, `name`),
  KEY `idx_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. Create rooms table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `rooms` (
  `id`            int(11)         NOT NULL AUTO_INCREMENT,
  `name`          varchar(150)    NOT NULL,
  `hotel`         varchar(150)    NOT NULL,
  `city`          varchar(80)     NOT NULL,
  `area`          varchar(80)     NOT NULL,
  `type`          varchar(50)     NOT NULL DEFAULT 'Standard',
  `price_night`   int(11)         NOT NULL DEFAULT 0,
  `price_hourly`  int(11)         NOT NULL DEFAULT 0,
  `rating`        decimal(3,1)    NOT NULL DEFAULT 0.0,
  `reviews_count` int(11)         NOT NULL DEFAULT 0,
  `amenities`     text,
  `image`         varchar(500),
  `available`     tinyint(1)      NOT NULL DEFAULT 1,
  `created_at`    datetime        NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. Create room_bookings table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `room_bookings` (
  `id`           int(11)      NOT NULL AUTO_INCREMENT,
  `room_id`      int(11)      NOT NULL,
  `guest_name`   varchar(150) NOT NULL,
  `guest_email`  varchar(255) NOT NULL,
  `guest_phone`  varchar(30),
  `check_in`     date         NOT NULL,
  `check_out`    date         NOT NULL,
  `nights`       int(11)      NOT NULL DEFAULT 1,
  `guests`       int(11)      NOT NULL DEFAULT 1,
  `total_amount` int(11)      NOT NULL DEFAULT 0,
  `notes`        text,
  `status`       enum('pending','confirmed','cancelled','completed') NOT NULL DEFAULT 'pending',
  `created_at`   datetime     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_room_id`  (`room_id`),
  KEY `idx_check_in` (`check_in`),
  KEY `idx_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. Create bookings table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `bookings` (
  `id`           int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`      int(10) UNSIGNED NOT NULL,
  `escort_id`    int(10) UNSIGNED NOT NULL,
  `booking_date` date             NOT NULL,
  `start_time`   time             NOT NULL,
  `duration_hrs` tinyint(3) UNSIGNED NOT NULL DEFAULT 1,
  `type`         enum('hourly','overnight','video') NOT NULL DEFAULT 'hourly',
  `amount`       int(10) UNSIGNED NOT NULL DEFAULT 0,
  `location`     varchar(300)     DEFAULT NULL,
  `notes`        text             DEFAULT NULL,
  `status`       enum('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at`   datetime         NOT NULL DEFAULT current_timestamp(),
  `updated_at`   datetime         NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id`   (`user_id`),
  KEY `idx_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. Create password_resets table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `email`      varchar(255) NOT NULL,
  `token`      varchar(100) NOT NULL,
  `expires_at` datetime     NOT NULL,
  `created_at` datetime     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. Create reviews table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `escort_id`  int(11)      NOT NULL,
  `user_id`    int(11)      NOT NULL,
  `rating`     tinyint      NOT NULL DEFAULT 5,
  `comment`    text,
  `created_at` datetime     NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_escort_id` (`escort_id`),
  KEY `idx_user_id`   (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. Create favorites and followers tables
-- =============================================================================
CREATE TABLE IF NOT EXISTS `favorites` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    int(11) NOT NULL,
  `escort_id`  int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fav` (`user_id`, `escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `followers` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    int(11) NOT NULL,
  `escort_id`  int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_follow` (`user_id`, `escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 13. Create adverts table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `adverts` (
  `id`          int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`   int(10) UNSIGNED DEFAULT NULL,
  `title`       varchar(200)     NOT NULL,
  `description` text             DEFAULT NULL,
  `image`       varchar(500)     DEFAULT NULL,
  `link`        varchar(500)     DEFAULT NULL,
  `position`    enum('banner','sidebar','card','popup') NOT NULL DEFAULT 'banner',
  `is_active`   tinyint(1)       NOT NULL DEFAULT 1,
  `starts_at`   datetime         DEFAULT NULL,
  `ends_at`     datetime         DEFAULT NULL,
  `created_at`  datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 14. Create blacklist table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id`          int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        varchar(200)     NOT NULL,
  `phone`       varchar(20)      DEFAULT NULL,
  `reason`      text             NOT NULL,
  `reported_by` int(10) UNSIGNED DEFAULT NULL,
  `created_at`  datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 15. Create messages table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id`          int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `sender_id`   int(10) UNSIGNED NOT NULL,
  `receiver_id` int(10) UNSIGNED NOT NULL,
  `body`        text             NOT NULL,
  `read`        tinyint(1)       NOT NULL DEFAULT 0,
  `created_at`  datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_sender`   (`sender_id`),
  KEY `idx_receiver` (`receiver_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 16. Create notifications table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    int(10) UNSIGNED NOT NULL,
  `type`       varchar(50)      NOT NULL DEFAULT 'system',
  `text`       varchar(500)     NOT NULL DEFAULT '',
  `link`       varchar(300)     NOT NULL DEFAULT '/',
  `dot`        varchar(20)      NOT NULL DEFAULT '#8B0000',
  `avatar`     varchar(500)     DEFAULT NULL,
  `read_at`    datetime         DEFAULT NULL,
  `created_at` datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id`  (`user_id`),
  KEY `idx_read_at`  (`read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Migrate old notifications schema if upgrading from earlier version
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `text`    varchar(500) NOT NULL DEFAULT '';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `link`    varchar(300) NOT NULL DEFAULT '/';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `dot`     varchar(20)  NOT NULL DEFAULT '#8B0000';
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `avatar`  varchar(500) DEFAULT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `read_at` datetime     DEFAULT NULL;
-- Migrate old title/body to text if present
UPDATE `notifications` SET `text` = COALESCE(NULLIF(`text`,''), title, body, 'Notification') WHERE `text` = '' AND (title IS NOT NULL OR body IS NOT NULL);

-- =============================================================================
-- 17. Create sessions table
-- =============================================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`         varchar(128)     NOT NULL,
  `user_id`    int(10) UNSIGNED NOT NULL,
  `data`       text             DEFAULT NULL,
  `expires_at` datetime         NOT NULL,
  `created_at` datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 18. Create subscriptions table (escort platform subscription tracking)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `subscriptions` (
  `id`         int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    int(10) UNSIGNED NOT NULL,
  `escort_id`  int(10) UNSIGNED DEFAULT NULL,
  `plan`       varchar(50)      NOT NULL DEFAULT 'monthly',
  `amount`     int(10) UNSIGNED NOT NULL DEFAULT 0,
  `phone`      varchar(30)      DEFAULT NULL,
  `tx_ref`     varchar(100)     DEFAULT NULL,
  `status`     varchar(20)      NOT NULL DEFAULT 'pending',
  `expires_at` datetime         DEFAULT NULL,
  `created_at` datetime         NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime         NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user_id`  (`user_id`),
  KEY `idx_subscriptions_status`   (`status`),
  KEY `idx_subscriptions_expires`  (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 19. Default tier subscription prices in platform_settings
-- =============================================================================
INSERT IGNORE INTO `platform_settings` (`key`, `value`) VALUES
  ('tier_elite_monthly',    '8500'),
  ('tier_vip_monthly',      '4500'),
  ('tier_premium_monthly',  '2200'),
  ('tier_standard_monthly', '0'),
  ('featured_3day',         '500'),
  ('featured_weekly',       '1500'),
  ('featured_monthly',      '4500'),
  ('sub_monthly',           '500'),
  ('sub_quarterly',         '1200'),
  ('sub_annual',            '4000');

-- =============================================================================
-- DEPLOY INSTRUCTIONS
-- =============================================================================
-- 20. Profile claim requests (user claiming an unclaimed escort profile)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `profile_claims` (
  `id`         int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`  int(10) UNSIGNED NOT NULL,
  `user_id`    int(10) UNSIGNED NOT NULL,
  `message`    text             DEFAULT NULL,
  `status`     varchar(20)      NOT NULL DEFAULT 'pending',
  `created_at` datetime         NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime         NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_profile_claims_escort_id` (`escort_id`),
  KEY `idx_profile_claims_user_id`   (`user_id`),
  KEY `idx_profile_claims_status`    (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- This file runs automatically on every deploy via deploy-on-server.sh.
-- You do NOT need to run it manually in phpMyAdmin.
--
-- To deploy:
--   cd /home/admin/wet3camp-build && git pull origin main
--   bash /home/admin/wet3camp-build/deploy-on-server.sh
--
-- ⚠️  DATABASE POLICY: MySQL / MariaDB is the ONLY production database.
--     Never convert this schema to PostgreSQL.  The Replit dev environment
--     uses PostgreSQL only as a fallback — production is always MySQL.
--
-- To create / reset the admin account (OPTION 1 — direct SQL in phpMyAdmin):
--   Run the INSERT below, replacing the password_hash with a freshly generated
--   one from the /api/auth/admin-reset endpoint or by running the hash script.
--   The hash format is:  <16-byte-hex-salt>:<64-byte-hex-scrypt-hash>
--
--   INSERT INTO `users` (`username`, `email`, `password_hash`, `display_name`, `role`, `is_active`)
--   VALUES ('admin', 'admin@wet3.camp', 'PASTE_HASH_HERE', 'Platform Admin', 'admin', 1)
--   ON DUPLICATE KEY UPDATE
--     `password_hash` = 'PASTE_HASH_HERE',
--     `display_name`  = 'Platform Admin',
--     `role`          = 'admin',
--     `is_active`     = 1;
--
-- To create / reset the admin account (OPTION 2 — API endpoint after deploy):
--   curl -s -X POST https://wet3.camp/api/auth/admin-reset \
--     -H "Content-Type: application/json" \
--     -d '{"secret":"MyResetKey999","email":"admin@wet3.camp","password":"YourNewPassword","name":"Platform Admin"}'
--   (Requires ADMIN_RESET_SECRET=MyResetKey999 in /home/admin/api-server/env)
--
-- To diagnose issues on the live server, visit:
--   GET https://wet3.camp/api/admin/health  (requires admin login token)
-- =============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- Content tables (events, escort_videos, shop_products, testimonials,
--                 blacklist_reports)
-- Added 2026-06-22 — run in phpMyAdmin before deploying
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `events` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `title`       VARCHAR(200)     NOT NULL,
  `description` TEXT,
  `event_date`  DATE             NOT NULL,
  `event_time`  VARCHAR(20)      DEFAULT '',
  `venue`       VARCHAR(200)     DEFAULT '',
  `city`        VARCHAR(100)     DEFAULT 'Nairobi',
  `price`       INT UNSIGNED     DEFAULT 0,
  `capacity`    INT UNSIGNED     DEFAULT 50,
  `attending`   INT UNSIGNED     DEFAULT 0,
  `escorts`     INT UNSIGNED     DEFAULT 0,
  `category`    VARCHAR(50)      DEFAULT 'Mixer',
  `image_url`   TEXT,
  `featured`    TINYINT(1)       DEFAULT 0,
  `is_active`   TINYINT(1)       DEFAULT 1,
  `created_at`  DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `escort_videos` (
  `id`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `escort_id`   INT UNSIGNED,
  `title`       VARCHAR(200)     NOT NULL,
  `thumbnail`   TEXT,
  `video_url`   TEXT,
  `tier`        ENUM('free','premium','vip','elite') DEFAULT 'free',
  `is_locked`   TINYINT(1)       DEFAULT 0,
  `price_kes`   INT UNSIGNED     DEFAULT 0,
  `duration`    VARCHAR(20)      DEFAULT '',
  `view_count`  INT UNSIGNED     DEFAULT 0,
  `is_active`   TINYINT(1)       DEFAULT 1,
  `created_at`  DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `shop_products` (
  `id`           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(200)     NOT NULL,
  `description`  TEXT,
  `price_kes`    INT UNSIGNED     DEFAULT 0,
  `image_url`    TEXT,
  `category`     VARCHAR(80)      DEFAULT 'General',
  `rating`       DECIMAL(2,1)     DEFAULT 0.0,
  `review_count` INT UNSIGNED     DEFAULT 0,
  `tag`          VARCHAR(50)      DEFAULT NULL,
  `features`     TEXT,
  `is_active`    TINYINT(1)       DEFAULT 1,
  `created_at`   DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `testimonials` (
  `id`         INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED,
  `name`       VARCHAR(100)     NOT NULL,
  `role`       ENUM('Client','Escort') DEFAULT 'Client',
  `city`       VARCHAR(100)     DEFAULT '',
  `rating`     TINYINT UNSIGNED DEFAULT 5,
  `text`       TEXT             NOT NULL,
  `avatar`     VARCHAR(10)      DEFAULT '',
  `verified`   TINYINT(1)       DEFAULT 0,
  `is_active`  TINYINT(1)       DEFAULT 0,
  `created_at` DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `blacklist_reports` (
  `id`           INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `name`         VARCHAR(200)     NOT NULL,
  `type`         ENUM('client','escort','agency') DEFAULT 'client',
  `reason`       TEXT             NOT NULL,
  `city`         VARCHAR(100)     DEFAULT 'Nairobi',
  `severity`     ENUM('medium','high','critical') DEFAULT 'medium',
  `report_count` INT UNSIGNED     DEFAULT 1,
  `reported_by`  INT UNSIGNED,
  `is_active`    TINYINT(1)       DEFAULT 0,
  `created_at`   DATETIME         DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Rename old `blacklist` table column if it exists (backward compat)
-- The old table had different column names; leave it as-is and use blacklist_reports going forward.
