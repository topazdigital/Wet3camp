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

-- ──────────────────────────────────────────────────────────────────────────────
-- Referral / Affiliate system
-- Added 2026-06-28 — run in phpMyAdmin before deploying
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `filename`   VARCHAR(200) NOT NULL,
  `applied_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schema_migrations_filename` (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `referrals` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          INT UNSIGNED NOT NULL,
  `code`             VARCHAR(20)  NOT NULL,
  `referred_user_id` INT UNSIGNED DEFAULT NULL,
  `type`             VARCHAR(20)  NOT NULL DEFAULT 'registration',
  `reward_kes`       INT UNSIGNED NOT NULL DEFAULT 500,
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `converted_at`     DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_referral_code` (`code`),
  KEY `idx_referrals_user_id` (`user_id`),
  KEY `idx_referrals_referred_user_id` (`referred_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────────────────────────────────────
-- Feed likes & comments (added 2026-06-28)
-- ──────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `feed_likes` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`  INT UNSIGNED NOT NULL,
  `user_id`    INT UNSIGNED DEFAULT NULL,
  `guest_key`  VARCHAR(64)  DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feed_likes_user`  (`escort_id`, `user_id`),
  UNIQUE KEY `uq_feed_likes_guest` (`escort_id`, `guest_key`),
  KEY `idx_feed_likes_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `feed_comments` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`   INT UNSIGNED NOT NULL,
  `user_id`     INT UNSIGNED DEFAULT NULL,
  `parent_id`   INT UNSIGNED DEFAULT NULL,
  `author_name` VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  `body`        TEXT         NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_feed_comments_escort_id` (`escort_id`),
  KEY `idx_feed_comments_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ──────────────────────────────────────────────────────────────────────────────
-- Shop products seed data (added 2026-06-28)
-- ──────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `shop_products` (`name`, `description`, `price_kes`, `image_url`, `category`, `rating`, `is_active`) VALUES
('Red Lace Lingerie Set — Push-Up Bra & Thong', 'Sexy lace bra and matching thong in red. Available in sizes S–XL. Discreet packaging guaranteed.', 1200, 'https://images.unsplash.com/photo-1617551307578-6b8c8dae8c30?w=400&q=80', 'Lingerie', 4.5, 1),
('Black Satin Corset Bodysuit', 'Elegant satin corset with adjustable lacing. Perfect for bedroom play. Available S–XXL.', 2500, 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&q=80', 'Lingerie', 4.7, 1),
('Sheer Babydoll Negligee — White', 'Sheer mesh babydoll with matching panty. Soft, delicate fabric. Ships discreetly.', 1800, 'https://images.unsplash.com/photo-1585565804112-f201f68c48b4?w=400&q=80', 'Lingerie', 4.3, 1),
('Wireless Mini Bullet Vibrator', 'Compact and powerful vibrator with 10 vibration modes. USB rechargeable. Waterproof.', 3500, 'https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&q=80', 'Toys', 4.8, 1),
('Silicone Couples Vibrating Ring', 'Stretchy couples ring with built-in vibration. Enhances pleasure for both partners. Rechargeable.', 2800, 'https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=400&q=80', 'Toys', 4.6, 1),
('Warming Massage Oil — Rose Scent 100ml', 'Premium warming massage oil with rose fragrance. Body-safe, non-greasy formula.', 950, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80', 'Wellness', 4.4, 1),
('Lavender Massage Candle 150g', 'Dual-purpose massage candle — burns as a candle, melts into massage oil. Lavender scent.', 1100, 'https://images.unsplash.com/photo-1602523961358-f9f03dd557db?w=400&q=80', 'Wellness', 4.5, 1),
('Satin Blindfold & Restraint Set', 'Soft satin blindfold with matching wrist cuffs. Beginners bondage set. Easy-release design.', 1650, 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80', 'Accessories', 4.3, 1),
('Feather Tickler — Red & Black', 'Soft ostrich feather tickler on a faux leather handle. 35cm length. Great for foreplay.', 850, 'https://images.unsplash.com/photo-1563208723-68eb3f54a3bc?w=400&q=80', 'Accessories', 4.2, 1),
('Personal Water-Based Lubricant 200ml', 'Premium water-based lubricant. Compatible with all toy materials and condoms. Fragrance-free.', 750, 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=400&q=80', 'Wellness', 4.6, 1),
('Naughty Dice Game Set (2 dice)', 'Couple naughty dice game. Two dice — one for actions, one for body parts. Hours of fun!', 600, 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?w=400&q=80', 'Accessories', 4.1, 1),
('Thigh High Fishnet Stockings', 'Classic fishnet thigh-high stockings. One size fits most. Available in black & red.', 450, 'https://images.unsplash.com/photo-1617469165786-8007eda3caa7?w=400&q=80', 'Lingerie', 4.0, 1),
('Remote-Controlled Vibrating Panties', 'Wireless remote control up to 10m range. 12 vibration modes. Waterproof. USB charging.', 5500, 'https://images.unsplash.com/photo-1617551307578-6b8c8dae8c30?w=400&q=80', 'Toys', 4.7, 1),
('Aphrodisiac Chocolate Truffles (Box of 12)', 'Premium Belgian chocolate truffles infused with natural aphrodisiac herbs. Made in Kenya.', 1400, 'https://images.unsplash.com/photo-1548741487-18d363dc4469?w=400&q=80', 'Wellness', 4.5, 1),
('Red Room Beginner Kit (5-piece)', 'Complete starter kit: blindfold, cuffs, tickler, paddle, and bondage tape. Great gift set.', 4200, 'https://images.unsplash.com/photo-1563208723-68eb3f54a3bc?w=400&q=80', 'Accessories', 4.8, 1),
('Faux Leather Harness Bra Set', 'Adjustable faux leather harness bra with matching G-string. One size fits most.', 2200, 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?w=400&q=80', 'Lingerie', 4.4, 1),
('Pheromone Perfume for Women 30ml', 'Science-backed pheromone spray to attract and captivate. Long-lasting floral scent.', 2800, 'https://images.unsplash.com/photo-1590736969955-71cc94901144?w=400&q=80', 'Wellness', 4.6, 1),
('Vibrating Cock Ring — Triple Action', 'Triple stimulation cock ring with 3 vibration points. Stretchy silicone. USB rechargeable.', 3200, 'https://images.unsplash.com/photo-1612965607446-25e1332775ae?w=400&q=80', 'Toys', 4.5, 1),
('Erotic Massage Gift Set (4 items)', 'Set includes massage oil, massage candle, feather tickler, and silk ties. Perfect gift set.', 3800, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&q=80', 'Wellness', 4.7, 1),
('Sexy Nurse Costume (Complete Set)', 'Full nurse roleplay costume: dress, cap, and accessories. Available S–XL. Discreet shipping.', 2600, 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&q=80', 'Accessories', 4.3, 1);

-- ──────────────────────────────────────────────────────────────────────────────
-- Rooms / BnB seed data (added 2026-06-28)
-- ──────────────────────────────────────────────────────────────────────────────
INSERT IGNORE INTO `rooms` (`name`, `hotel`, `city`, `area`, `type`, `price_night`, `price_hourly`, `rating`, `amenities`, `image`, `available`) VALUES
('Deluxe King Room', 'Trademark Hotel Westlands', 'Nairobi', 'Westlands', 'Deluxe', 12000, 3000, 4.7, 'WiFi,AC,Pool,Breakfast,Gym,Parking', 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80', 1),
('Superior Room with City View', 'Radisson Blu Nairobi', 'Nairobi', 'Upperhill', 'Superior', 18000, 4500, 4.8, 'WiFi,AC,Pool,Spa,Gym,Bar,Restaurant', 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600&q=80', 1),
('Cozy Studio Apartment', 'Lavington Gardens BnB', 'Nairobi', 'Lavington', 'Suite', 5500, 1500, 4.5, 'WiFi,Kitchen,AC,Netflix,Parking', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80', 1),
('Executive Suite — Kilimani', 'Hurlingham Suites', 'Nairobi', 'Kilimani', 'Suite', 9500, 2500, 4.6, 'WiFi,AC,Breakfast,Bar,Parking', 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600&q=80', 1),
('Standard Double Room', 'Karen Blixen Camp', 'Nairobi', 'Karen', 'Standard', 7200, 2000, 4.4, 'WiFi,AC,Garden,Parking,Breakfast', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80', 1),
('Private Garden Cottage', 'Gigiri BnB Retreat', 'Nairobi', 'Gigiri', 'Suite', 8000, 2200, 4.6, 'WiFi,AC,Garden,Kitchen,Parking', 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80', 1),
('Modern 1BR Apartment — CBD', 'View Park Towers Apartments', 'Nairobi', 'CBD', 'Standard', 4500, 1200, 4.2, 'WiFi,AC,Kitchen,Security', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80', 1),
('Runda Villa Room', 'Runda Luxury BnB', 'Nairobi', 'Runda', 'Deluxe', 14000, 3500, 4.9, 'WiFi,AC,Pool,Gym,Chef,Parking,Security', 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600&q=80', 1),
('Parklands Studio — Short Stay', 'Parklands Cozy Rooms', 'Nairobi', 'Parklands', 'Standard', 3800, 1000, 4.1, 'WiFi,AC,Security,Parking', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80', 1),
('Premium Penthouse Suite', 'Westlands Sky Suites', 'Nairobi', 'Westlands', 'Suite', 25000, 6000, 4.9, 'WiFi,AC,Pool,Rooftop,Bar,Gym,Spa,Chef', 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=80', 1),
('Beachfront Standard Room', 'Sarova Whitesands Beach Resort', 'Mombasa', 'Bamburi', 'Standard', 9800, 2500, 4.6, 'WiFi,AC,Pool,Beach,Restaurant,Bar', 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=80', 1),
('Ocean View Deluxe Room', 'Bahari Beach Hotel', 'Mombasa', 'Nyali', 'Deluxe', 12000, 3000, 4.5, 'WiFi,AC,Pool,Beach Access,Bar,Breakfast', 'https://images.unsplash.com/photo-1540541338537-41369b2a1b10?w=600&q=80', 1),
('Diani Beach Cottage', 'Diani Palm BnB', 'Mombasa', 'Diani', 'Suite', 7500, 2000, 4.7, 'WiFi,AC,Garden,Beach Proximity,Kitchen', 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=600&q=80', 1),
('Mtwapa Private Room', 'Mtwapa Breeze Hotel', 'Mombasa', 'Mtwapa', 'Standard', 4200, 1100, 4.0, 'WiFi,AC,Bar,Parking', 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&q=80', 1),
('Lakeside Suite', 'Imperial Hotel Kisumu', 'Kisumu', 'Milimani', 'Suite', 8500, 2200, 4.5, 'WiFi,AC,Pool,Lake View,Restaurant,Gym', 'https://images.unsplash.com/photo-1514924013411-cbf25faa35bb?w=600&q=80', 1),
('Garden View Standard Room', 'Victoria Comfort Hotel', 'Kisumu', 'Kondele', 'Standard', 3500, 900, 4.1, 'WiFi,AC,Parking,Restaurant', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=600&q=80', 1),
('Classic Double Room', 'Midland Hotel Nakuru', 'Nakuru', 'Central', 'Standard', 4800, 1200, 4.2, 'WiFi,AC,Restaurant,Parking', 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&q=80', 1),
('Business Double Room', 'Sirikwa Hotel Eldoret', 'Eldoret', 'Central', 'Standard', 5200, 1300, 4.3, 'WiFi,AC,Gym,Restaurant,Parking', 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600&q=80', 1);
