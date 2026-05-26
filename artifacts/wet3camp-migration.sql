-- =============================================================================
-- Wet3.camp — Database Migration SQL (v3)
-- Run this in phpMyAdmin (admin_wet3camp database) BEFORE deploying new code.
-- Every statement uses IF NOT EXISTS / IGNORE — 100% safe to re-run.
-- =============================================================================

-- =============================================================================
-- 1. Fix escorts.age column so registration never fails when age is missing
-- =============================================================================
ALTER TABLE escorts
  MODIFY COLUMN age tinyint(3) UNSIGNED NOT NULL DEFAULT 0;

-- =============================================================================
-- 2. Add missing columns to escorts table (safe — only adds if missing)
-- =============================================================================
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `is_active` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `online`    tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `lat`       decimal(10,7) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `lng`       decimal(10,7) DEFAULT NULL;

-- =============================================================================
-- 3. Create platform_settings table (Admin → Settings & API Keys tabs)
--    THIS IS REQUIRED for admin settings save/load to work.
-- =============================================================================
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `key`        varchar(100)  NOT NULL,
  `value`      text          NOT NULL DEFAULT '',
  `updated_at` datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. Ensure escort_gallery table exists (for photo uploads)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `escort_gallery` (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `escort_id`   int(11)      NOT NULL,
  `image_url`   varchar(500) NOT NULL,
  `sort_order`  int(11)      NOT NULL DEFAULT 0,
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. Ensure escort_languages table exists
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
-- 6. Ensure escort_services table exists
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
-- 7. Create rooms table (for the /rooms page)
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
  `created_at`    datetime        NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
  `created_at`   datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_room_id`  (`room_id`),
  KEY `idx_check_in` (`check_in`),
  KEY `idx_status`   (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. Ensure password_resets table exists (for forgot-password flow)
-- =============================================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `email`      varchar(255) NOT NULL,
  `token`      varchar(100) NOT NULL,
  `expires_at` datetime     NOT NULL,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 10. Ensure reviews table exists
-- =============================================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`         int(11)      NOT NULL AUTO_INCREMENT,
  `escort_id`  int(11)      NOT NULL,
  `user_id`    int(11)      NOT NULL,
  `rating`     tinyint      NOT NULL DEFAULT 5,
  `comment`    text,
  `created_at` datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_escort_id` (`escort_id`),
  KEY `idx_user_id`   (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 11. Ensure favorites and followers tables exist
-- =============================================================================
CREATE TABLE IF NOT EXISTS `favorites` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    int(11) NOT NULL,
  `escort_id`  int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fav` (`user_id`, `escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `followers` (
  `id`         int(11) NOT NULL AUTO_INCREMENT,
  `user_id`    int(11) NOT NULL,
  `escort_id`  int(11) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_follow` (`user_id`, `escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 12. Create the first admin user
--    RECOMMENDED: Use the built-in setup endpoint via PowerShell (see below)
--    POST https://wet3.camp/api/auth/setup-admin
--    Body: { "email": "admin@wet3camp.com", "password": "YourSecurePassword", "name": "Platform Admin" }
--    This only works ONCE — disabled after first admin is created.
--
--    PowerShell one-liner:
--    Invoke-RestMethod -Uri "https://wet3.camp/api/auth/setup-admin" -Method POST -ContentType "application/json" -Body '{"email":"admin@wet3camp.com","password":"YourSecurePassword","name":"Platform Admin"}'
-- =============================================================================

-- =============================================================================
-- POWERSHELL DEPLOY INSTRUCTIONS
-- ================================
-- 1. SSH into your server and run:
--      cd /home/admin/wet3camp-build
--      git pull origin main
--      bash /home/admin/wet3camp-build/deploy-on-server.sh
--
-- 2. Then run THIS SQL in phpMyAdmin on database admin_wet3camp:
--    (Copy everything above and paste into phpMyAdmin → SQL tab → Go)
--
-- 3. After migration, test admin panel at wet3.camp/admin
--    - Go to API Keys tab → enter SMTP Host, Port, Username, Password → Save each
--    - Click "Test All Connections" to verify SMTP, DB and Telegram
--    - Go to Escorts tab to see all escorts including pending ones (e.g. Bettcy)
--    - Approve or reject escorts from the Escorts tab
-- =============================================================================
