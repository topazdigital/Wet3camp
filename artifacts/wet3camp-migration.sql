-- =============================================================================
-- Wet3.camp — Database Migration SQL
-- Run this in phpMyAdmin (your wet3camp_db database) BEFORE going live.
-- Execute each section in order.
-- =============================================================================

-- 1. Fix escorts.age column so registration doesn't fail when age is not provided
ALTER TABLE escorts
  MODIFY COLUMN age tinyint(3) UNSIGNED NOT NULL DEFAULT 0;

-- =============================================================================
-- 2. Create platform_settings table (API Keys & Settings tab in admin panel)
-- =============================================================================
CREATE TABLE IF NOT EXISTS platform_settings (
  `key`        varchar(100)  NOT NULL,
  `value`      text          NOT NULL,
  `updated_at` datetime      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. Create rooms table (for the /rooms page)
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
-- 4. Create room_bookings table
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
  KEY `idx_room_id`   (`room_id`),
  KEY `idx_check_in`  (`check_in`),
  KEY `idx_status`    (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 5. Remove fake/seed escort profiles (user_id IS NULL = seeded data)
--    IMPORTANT: Run this ONLY when you are ready — it permanently deletes
--    fake profiles. Safe to skip if you already have real escorts.
-- =============================================================================
-- Step 5a: Remove dependent rows first
DELETE FROM escort_gallery   WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM escort_languages WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
DELETE FROM escort_services  WHERE escort_id IN (SELECT id FROM escorts WHERE user_id IS NULL);
-- Step 5b: Remove the fake escorts
DELETE FROM escorts WHERE user_id IS NULL;

-- =============================================================================
-- 6. Create the first admin user
--    OPTION A (recommended): Use the built-in setup endpoint instead.
--    Visit:  POST https://wet3.camp/api/auth/setup-admin
--    Body:   { "email": "admin@wet3camp.com", "password": "YourSecurePassword", "name": "Platform Admin" }
--    This only works ONCE — it's disabled after the first admin is created.
--
--    OPTION B: If you prefer SQL, first generate a hash by running this on
--    your server shell:
--      node -e "
--        const { scrypt, randomBytes } = require('crypto');
--        const p = require('util').promisify;
--        const salt = randomBytes(16).toString('hex');
--        p(scrypt)('YourPassword', salt, 64).then(h => console.log(salt+':'+h.toString('hex')));
--      "
--    Then insert:
-- INSERT INTO users (username, email, password_hash, display_name, role, is_active)
-- VALUES ('admin', 'admin@wet3camp.com', '<paste-hash-here>', 'Platform Admin', 'admin', 1);
-- =============================================================================

-- =============================================================================
-- 7. (Optional) Sample rooms data — uncomment to add a few sample rooms
-- =============================================================================
-- INSERT INTO rooms (name, hotel, city, area, type, price_night, price_hourly, rating, reviews_count, amenities, available) VALUES
-- ('Deluxe King Suite',  'Serena Hotel',      'Nairobi', 'Upper Hill',  'Suite',   18000, 5000,  4.8, 127, 'WiFi, Parking, Breakfast, 24hr Security', 1),
-- ('Executive Room',     'Tribe Hotel',       'Nairobi', 'Gigiri',      'Executive',12000, 3500,  4.6,  89, 'WiFi, Parking, 24hr Security',           1),
-- ('Ocean View Villa',   'Serena Beach Hotel','Mombasa',  'Nyali',       'Villa',   22000, 6500,  4.9,  64, 'WiFi, Parking, Breakfast, 24hr Security', 1),
-- ('Premier Suite',      'PrideInn Azure',    'Mombasa',  'Mombasa Road','Suite',   15000, 4500,  4.7,  98, 'WiFi, Parking, Breakfast',                1);
