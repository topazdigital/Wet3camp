-- =============================================================================
-- Wet3.camp — Database Migration SQL (v2)
-- Run this in phpMyAdmin (admin_wet3camp database) BEFORE going live.
-- Each statement uses IF NOT EXISTS / IGNORE — safe to run multiple times.
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
-- 3. Create platform_settings table (Admin → Settings tab)
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  `key`        varchar(100)  NOT NULL,
  `value`      text          NOT NULL,
  `updated_at` datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 4. Ensure escort_gallery table exists (for photo uploads)
-- =============================================================================
CREATE TABLE IF NOT EXISTS escort_gallery (
  `id`          int(11)      NOT NULL AUTO_INCREMENT,
  `escort_id`   int(11)      NOT NULL,
  `image_url`   varchar(500) NOT NULL,
  `sort_order`  int(11)      NOT NULL DEFAULT 0,
  `created_at`  datetime     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. Create rooms table (for the /rooms page)
-- =============================================================================
CREATE TABLE IF NOT EXISTS rooms (
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
-- 6. Create room_bookings table
-- =============================================================================
CREATE TABLE IF NOT EXISTS room_bookings (
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
-- 7. Remove fake/seed escort profiles (ADMIN BUTTON DOES THIS — SQL backup)
--    Run this ONLY if the "Delete Fakes" button in admin panel doesn't work.
--    It deletes ALL escorts with no real user account (user_id IS NULL).
-- =============================================================================
-- Step A: Disable FK checks so dependent rows don't block deletion
SET FOREIGN_KEY_CHECKS=0;

-- Step B: Remove all rows that reference fake escort IDs
DELETE FROM escort_gallery   WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM escort_languages WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM escort_services  WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM favorites        WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM followers        WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM reviews          WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM bookings         WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);

-- Step C: Delete the fake escort profiles
DELETE FROM escorts WHERE user_id IS NULL;

-- Step D: Re-enable FK checks
SET FOREIGN_KEY_CHECKS=1;

-- =============================================================================
-- 8. Create the first admin user
--    OPTION A (recommended): Use the built-in setup endpoint.
--    POST https://wet3.camp/api/auth/setup-admin
--    Body: { "email": "admin@wet3camp.com", "password": "YourSecurePassword", "name": "Platform Admin" }
--    This only works ONCE — disabled after first admin is created.
-- =============================================================================

-- =============================================================================
-- 9. (Optional) Sample rooms data
-- =============================================================================
-- INSERT INTO rooms (name, hotel, city, area, type, price_night, price_hourly, rating, reviews_count, amenities, available) VALUES
-- ('Deluxe King Suite',  'Serena Hotel',       'Nairobi', 'Upper Hill',  'Suite',    18000, 5000, 4.8, 127, 'WiFi, Parking, Breakfast, 24hr Security', 1),
-- ('Executive Room',     'Tribe Hotel',        'Nairobi', 'Gigiri',      'Executive',12000, 3500, 4.6,  89, 'WiFi, Parking, 24hr Security',           1),
-- ('Ocean View Villa',   'Serena Beach Hotel', 'Mombasa',  'Nyali',       'Villa',    22000, 6500, 4.9,  64, 'WiFi, Parking, Breakfast, 24hr Security', 1),
-- ('Premier Suite',      'PrideInn Azure',     'Mombasa',  'Mombasa Road','Suite',    15000, 4500, 4.7,  98, 'WiFi, Parking, Breakfast',                1);
