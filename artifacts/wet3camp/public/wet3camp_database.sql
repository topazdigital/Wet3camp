-- ============================================================
-- Wet3 Camp — MySQL Database Schema
-- Database : admin_wet3camp
-- User     : admin_betcheza
-- Created  : 2026-05-25
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+03:00";
SET NAMES utf8mb4;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)  NOT NULL UNIQUE,
  `email`         VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role`          ENUM('user','escort','admin') NOT NULL DEFAULT 'user',
  `display_name`  VARCHAR(100) DEFAULT NULL,
  `avatar`        VARCHAR(500) DEFAULT NULL,
  `phone`         VARCHAR(20)  DEFAULT NULL,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email`    (`email`),
  INDEX `idx_username` (`username`),
  INDEX `idx_role`     (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default admin account (password: Admin@Wet3Camp2026 — change immediately)
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`, `display_name`) VALUES
('admin', 'admin@wet3.camp', '$2b$12$examplehashchangeme', 'admin', 'Site Administrator');

-- ============================================================
-- TABLE: sessions  (auth tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS `sessions` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED    NOT NULL,
  `token`      VARCHAR(512)    NOT NULL UNIQUE,
  `ip_address` VARCHAR(45)     DEFAULT NULL,
  `user_agent` VARCHAR(500)    DEFAULT NULL,
  `expires_at` DATETIME        NOT NULL,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_token`   (`token`(64)),
  INDEX `idx_user_id` (`user_id`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: escorts
-- ============================================================
CREATE TABLE IF NOT EXISTS `escorts` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       INT UNSIGNED DEFAULT NULL,          -- linked user account if she registers
  `name`          VARCHAR(100) NOT NULL,
  `age`           TINYINT UNSIGNED NOT NULL,
  `city`          VARCHAR(100) NOT NULL,
  `area`          VARCHAR(100) NOT NULL,
  `lat`           DECIMAL(9,6) NOT NULL DEFAULT 0,
  `lng`           DECIMAL(9,6) NOT NULL DEFAULT 0,
  `tier`          ENUM('elite','vip','premium','standard','free') NOT NULL DEFAULT 'standard',
  `rating`        DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  `reviews_count` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  `bio`           TEXT         DEFAULT NULL,
  `image`         VARCHAR(500) DEFAULT NULL,
  `height`        VARCHAR(20)  DEFAULT NULL,
  `body_type`     VARCHAR(50)  DEFAULT NULL,
  `ethnicity`     VARCHAR(50)  DEFAULT NULL,
  `hair_color`    VARCHAR(50)  DEFAULT NULL,
  `price_hourly`  INT UNSIGNED NOT NULL DEFAULT 0,
  `price_overnight` INT UNSIGNED NOT NULL DEFAULT 0,
  `price_video`   INT UNSIGNED NOT NULL DEFAULT 0,
  `whatsapp`      VARCHAR(20)  DEFAULT NULL,
  `telegram`      VARCHAR(100) DEFAULT NULL,
  `phone`         VARCHAR(20)  DEFAULT NULL,
  `available`     TINYINT(1)   NOT NULL DEFAULT 0,
  `verified`      TINYINT(1)   NOT NULL DEFAULT 0,
  `online`        TINYINT(1)   NOT NULL DEFAULT 0,
  `is_active`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_city`      (`city`),
  INDEX `idx_tier`      (`tier`),
  INDEX `idx_available` (`available`),
  INDEX `idx_verified`  (`verified`),
  INDEX `idx_rating`    (`rating` DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed escorts from the 25 base profiles
INSERT INTO `escorts`
  (`name`,`age`,`city`,`area`,`lat`,`lng`,`tier`,`rating`,`reviews_count`,`bio`,`height`,`body_type`,`ethnicity`,`hair_color`,`price_hourly`,`price_overnight`,`price_video`,`whatsapp`,`telegram`,`available`,`verified`,`online`)
VALUES
  ('Amara K.',   24,'Nairobi','Nairobi CBD', -1.2921, 36.8219,'elite',  4.9,156,'Elite companion based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',                             '5\'6"', 'Slim/Athletic','Kenyan',      'Black',         8000, 50000,3000,'254712345001','amarak_wet3camp',      1,1,1),
  ('Zara M.',    26,'Nairobi','Westlands',   -1.2679, 36.8082,'vip',    4.8,142,'VIP escort in Westlands. Fluent in 3 languages, world-traveller, and passionate about providing a premium, discreet service.',                                                                                                                         '5\'7"', 'Athletic',     'Kenyan',      'Natural',       6500, 40000,2500,'254712345002','zaram_wet3camp',        1,1,1),
  ('Luna K.',    23,'Nairobi','Karen',       -1.3176, 36.7063,'vip',    4.7,128,'Karen-based VIP companion. Known for my intelligence, elegance and impeccable style.',                                                                                                                                                                   '5\'5"', 'Slim',         'Kenyan',      'Dark Brown',    5000, 35000,2000,'254712345003','lunak_wet3camp',        0,1,0),
  ('Sophia N.',  27,'Nairobi','Kilimani',    -1.2903, 36.7855,'premium',4.6,115,'Premium Kilimani escort with a warm personality and stunning looks. Discretion guaranteed.',                                                                                                                                                             '5\'4"', 'Curvy',        'Kenyan',      'Black',         4000, 25000,1500,'254712345004','sophian_wet3camp',      1,1,1),
  ('Priya S.',   25,'Nairobi','Lavington',   -1.2820, 36.7726,'premium',4.8,189,'Half-Kenyan, half-Indian beauty residing in Lavington. Exotic, educated, and always well-presented.',                                                                                                                                                   '5\'5"', 'Slim/Toned',   'Mixed',       'Black',         5500, 38000,2200,'254712345005','priyas_wet3camp',       1,1,0),
  ('Fatuma H.',  22,'Nairobi','Parklands',   -1.2575, 36.8205,'elite',  4.9,203,'Top-rated elite escort in Parklands. Coastal beauty who moved to Nairobi for a vibrant lifestyle.',                                                                                                                                                     '5\'6"', 'Slim',         'Swahili',     'Black',         9000, 55000,3500,'254712345006','fatumah_wet3camp',      1,1,1),
  ('Grace W.',   28,'Nairobi','Upperhill',   -1.3000, 36.8192,'premium',4.5, 97,'Professional companion based in Upperhill, Nairobi\'s business district. Corporate-friendly, always punctual.',                                                                                                                                         '5\'7"', 'Athletic',     'Kenyan',      'Black',         4500, 28000,1800,'254712345007','gracew_wet3camp',       1,1,0),
  ('Naomi J.',   24,'Nairobi','Gigiri',      -1.2280, 36.8032,'vip',    4.7,134,'Upscale companion in Gigiri, near the UN complex. Multilingual, sophisticated and experienced with international clients.',                                                                                                                               '5\'8"', 'Slim/Tall',    'Kenyan',      'Natural',       7000, 45000,3000,'254712345008','naomij_wet3camp',       0,1,0),
  ('Aisha O.',   21,'Nairobi','South B',     -1.3171, 36.8396,'standard',4.4,62,'Young, vibrant and fun-loving companion in South B. Fresh face on the platform but highly rated.',                                                                                                                                                       '5\'4"', 'Petite/Curvy', 'Kenyan',      'Black',         2500, 15000,1000,'254712345009','aishao_wet3camp',       1,1,1),
  ('Cynthia M.', 29,'Nairobi','Runda',       -1.2102, 36.8104,'elite',  4.9,178,'Nairobi\'s finest escort — Runda based, world-class service. A decade of experience in high-end companionship.',                                                                                                                                        '5\'9"', 'Slim/Tall',    'Kenyan',      'Relaxed/Dark',  12000,75000,4500,'254712345010','cyntham_wet3camp',      1,1,1),
  ('Brenda A.',  23,'Nairobi','Langata',     -1.3380, 36.7518,'premium',4.6, 88,'Langata beauty with a playful spirit. Always punctual and perfectly presented.',                                                                                                                                                                        '5\'5"', 'Curvy',        'Kenyan',      'Black',         3500, 22000,1500,'254712345011','brendaa_wet3camp',      1,0,1),
  ('Diana V.',   26,'Nairobi','Eastleigh',   -1.2726, 36.8478,'standard',4.3,54,'Vibrant Eastleigh companion offering authentic experiences. Somali heritage with a warm, welcoming personality.',                                                                                                                                        '5\'6"', 'Slim',         'Somali-Kenyan','Black',        2000, 12000,800, '254712345012','dianav_wet3camp',       1,1,0),
  ('Sharon K.',  25,'Nairobi','Embakasi',    -1.3211, 36.9009,'standard',4.2,47,'Embakasi based companion offering great value and genuine connections. Happy to travel within Nairobi.',                                                                                                                                                  '5\'3"', 'Average',      'Kenyan',      'Black',         1800, 10000,700, '254712345013','sharonk_wet3camp',      0,0,0),
  ('Kezia N.',   22,'Nairobi','Ngong Road',  -1.3028, 36.7677,'premium',4.7,103,'Slim and elegant companion along Ngong Road. University-educated, articulate and refined.',                                                                                                                                                              '5\'6"', 'Slim/Toned',   'Kenyan',      'Black',         3800, 24000,1600,'254712345014','kezian_wet3camp',       1,1,1),
  ('Mercy T.',   27,'Nairobi','Thika Road',  -1.2253, 36.8944,'vip',    4.6,121,'Thika Road VIP companion with a bubbly personality and killer looks.',                                                                                                                                                                                  '5\'5"', 'Curvy',        'Kenyan',      'Black',         5000, 30000,2000,'254712345015','mercyt_wet3camp',       1,1,0),
  ('Wanjiku G.', 30,'Mombasa','Nyali',       -4.0165, 39.7057,'elite',  4.9,231,'The queen of the Kenyan coast — Nyali\'s finest. Bilingual, stunning and endlessly sophisticated.',                                                                                                                                                     '5\'8"', 'Slim/Curvy',   'Kenyan',      'Black',         10000,60000,4000,'254712345016','wanjikug_wet3camp',     1,1,1),
  ('Akinyi B.',  23,'Mombasa','Bamburi',     -3.9835, 39.7287,'premium',4.5, 76,'Beach babe from Bamburi, Mombasa. Sun-kissed, carefree and unforgettably sensual.',                                                                                                                                                                     '5\'5"', 'Athletic',     'Luo-Kenyan',  'Natural',       4000, 25000,1500,'254712345017','akinyib_wet3camp',      1,1,1),
  ('Amina S.',   25,'Mombasa','Mombasa CBD', -4.0435, 39.6682,'vip',    4.7,145,'Mombasa CBD beauty with coastal charm and big-city sophistication. Experienced with international clientele.',                                                                                                                                            '5\'6"', 'Slim',         'Swahili',     'Black',         5500, 35000,2200,'254712345018','aminas_wet3camp',       0,1,0),
  ('Stella R.',  24,'Mombasa','Diani',       -4.2792, 39.5915,'vip',    4.8,163,'Diani beach escort — your ultimate coastal fantasy.',                                                                                                                                                                                                   '5\'7"', 'Toned',        'Kenyan',      'Dark Brown',    6000, 40000,2500,'254712345019','stellar_wet3camp',      1,1,1),
  ('Janet L.',   29,'Mombasa','Mtwapa',      -3.9405, 39.7345,'premium',4.4, 83,'Mtwapa escort offering premium coastal experiences.',                                                                                                                                                                                                   '5\'4"', 'Curvy',        'Kenyan',      'Black',         3500, 22000,1400,'254712345020','janetl_wet3camp',       1,0,0),
  ('Adhiambo P.',22,'Kisumu', 'Milimani',    -0.0917, 34.7680,'premium',4.6, 69,'Kisumu\'s premier companion based in upscale Milimani. Luo beauty with an outgoing personality.',                                                                                                                                                       '5\'5"', 'Petite/Slim',  'Luo',         'Black',         3000, 20000,1200,'254712345021','adhiambop_wet3camp',    1,1,1),
  ('Evalyne O.', 26,'Kisumu', 'Kisumu CBD',  -0.1022, 34.7617,'standard',4.3,44,'Kisumu lakeside beauty with a genuine, approachable personality.',                                                                                                                                                                                      '5\'4"', 'Average',      'Luo',         'Black',         2000, 13000,800, '254712345022','evalyneo_wet3camp',     1,0,0),
  ('Pauline R.', 28,'Nakuru', 'Nakuru CBD',  -0.3031, 36.0800,'premium',4.5, 57,'Rift Valley\'s finest companion based in Nakuru.',                                                                                                                                                                                                      '5\'5"', 'Slim',         'Kenyan',      'Black',         3200, 20000,1300,'254712345023','pauliner_wet3camp',     0,1,0),
  ('Sandra C.',  25,'Nakuru', 'Milimani Nakuru',-0.2882,36.0610,'vip',  4.7, 92,'VIP escort in Nakuru\'s prestigious Milimani area.',                                                                                                                                                                                                   '5\'6"', 'Athletic',     'Kenyan',      'Dark Brown',    4500, 28000,1800,'254712345024','sandrac_wet3camp',      1,1,1),
  ('Faith C.',   23,'Eldoret','Eldoret CBD',  0.5143, 35.2698,'standard',4.4,38,'North Rift\'s charming escort in Eldoret. Kalenjin beauty with an infectious laugh.',                                                                                                                                                                   '5\'6"', 'Slim/Athletic','Kalenjin',    'Black',         2200, 14000,900, '254712345025','faithc_wet3camp',       1,0,0);

-- ============================================================
-- TABLE: escort_gallery
-- ============================================================
CREATE TABLE IF NOT EXISTS `escort_gallery` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`  INT UNSIGNED NOT NULL,
  `image_url`  VARCHAR(500) NOT NULL,
  `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_escort_id` (`escort_id`),
  CONSTRAINT `fk_gallery_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: escort_services
-- ============================================================
CREATE TABLE IF NOT EXISTS `escort_services` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`  INT UNSIGNED NOT NULL,
  `name`       VARCHAR(100) NOT NULL,
  `available`  TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_escort_id` (`escort_id`),
  CONSTRAINT `fk_services_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: escort_languages
-- ============================================================
CREATE TABLE IF NOT EXISTS `escort_languages` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`  INT UNSIGNED NOT NULL,
  `language`   VARCHAR(50)  NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_escort_id` (`escort_id`),
  CONSTRAINT `fk_languages_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: messages  (platform in-app chat)
-- ============================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `sender_id`   INT UNSIGNED    NOT NULL,                -- users.id
  `escort_id`   INT UNSIGNED    NOT NULL,                -- escorts.id
  `content`     TEXT            NOT NULL,
  `is_from_escort` TINYINT(1)   NOT NULL DEFAULT 0,
  `read_at`     DATETIME        DEFAULT NULL,
  `created_at`  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_sender`    (`sender_id`),
  INDEX `idx_escort`    (`escort_id`),
  INDEX `idx_thread`    (`sender_id`, `escort_id`),
  INDEX `idx_created`   (`created_at`),
  CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_messages_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: bookings
-- ============================================================
CREATE TABLE IF NOT EXISTS `bookings` (
  `id`          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `user_id`     INT UNSIGNED  NOT NULL,
  `escort_id`   INT UNSIGNED  NOT NULL,
  `booking_date` DATE         NOT NULL,
  `start_time`  TIME          NOT NULL,
  `duration_hrs` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `type`        ENUM('hourly','overnight','video') NOT NULL DEFAULT 'hourly',
  `amount`      INT UNSIGNED  NOT NULL DEFAULT 0,
  `location`    VARCHAR(300)  DEFAULT NULL,
  `notes`       TEXT          DEFAULT NULL,
  `status`      ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id`    (`user_id`),
  INDEX `idx_escort_id`  (`escort_id`),
  INDEX `idx_status`     (`status`),
  INDEX `idx_date`       (`booking_date`),
  CONSTRAINT `fk_bookings_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_bookings_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS `reviews` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `escort_id`  INT UNSIGNED NOT NULL,
  `rating`     TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `content`    TEXT         DEFAULT NULL,
  `is_visible` TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_escort` (`user_id`, `escort_id`),
  INDEX `idx_escort_id` (`escort_id`),
  INDEX `idx_rating`    (`rating`),
  CONSTRAINT `fk_reviews_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: favorites
-- ============================================================
CREATE TABLE IF NOT EXISTS `favorites` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `escort_id`  INT UNSIGNED NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fav` (`user_id`, `escort_id`),
  INDEX `idx_user_id`   (`user_id`),
  INDEX `idx_escort_id` (`escort_id`),
  CONSTRAINT `fk_favs_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_favs_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: followers
-- ============================================================
CREATE TABLE IF NOT EXISTS `followers` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `escort_id`  INT UNSIGNED NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_follow` (`user_id`, `escort_id`),
  INDEX `idx_user_id`   (`user_id`),
  INDEX `idx_escort_id` (`escort_id`),
  CONSTRAINT `fk_followers_user`   FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
  CONSTRAINT `fk_followers_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED    NOT NULL,
  `type`       VARCHAR(50)     NOT NULL,   -- 'message','booking','review','follow','system'
  `title`      VARCHAR(200)    NOT NULL,
  `body`       TEXT            DEFAULT NULL,
  `link`       VARCHAR(300)    DEFAULT NULL,
  `is_read`    TINYINT(1)      NOT NULL DEFAULT 0,
  `created_at` DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_is_read` (`is_read`),
  CONSTRAINT `fk_notifs_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: password_resets
-- ============================================================
CREATE TABLE IF NOT EXISTS `password_resets` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `email`      VARCHAR(255) NOT NULL,
  `token`      VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` DATETIME     NOT NULL,
  `used_at`    DATETIME     DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_token` (`token`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: adverts
-- ============================================================
CREATE TABLE IF NOT EXISTS `adverts` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`   INT UNSIGNED DEFAULT NULL,
  `title`       VARCHAR(200) NOT NULL,
  `description` TEXT         DEFAULT NULL,
  `image`       VARCHAR(500) DEFAULT NULL,
  `link`        VARCHAR(500) DEFAULT NULL,
  `position`    ENUM('banner','sidebar','card','popup') NOT NULL DEFAULT 'banner',
  `is_active`   TINYINT(1)  NOT NULL DEFAULT 1,
  `starts_at`   DATETIME    DEFAULT NULL,
  `ends_at`     DATETIME    DEFAULT NULL,
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_is_active` (`is_active`),
  CONSTRAINT `fk_adverts_escort` FOREIGN KEY (`escort_id`) REFERENCES `escorts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: blacklist
-- ============================================================
CREATE TABLE IF NOT EXISTS `blacklist` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`        VARCHAR(200) NOT NULL,
  `phone`       VARCHAR(20)  DEFAULT NULL,
  `reason`      TEXT         NOT NULL,
  `reported_by` INT UNSIGNED DEFAULT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_phone` (`phone`),
  CONSTRAINT `fk_blacklist_user` FOREIGN KEY (`reported_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DONE
-- ============================================================
-- Upload instructions:
--   1. Log in to DirectAdmin → MySQL Databases
--   2. Database : admin_wet3camp  (already exists per your server setup)
--   3. Click "phpMyAdmin" or use the Import tab → select this file → Go
--   Alternatively via CLI on the server:
--     mysql -u admin_betcheza -p admin_wet3camp < wet3camp_database.sql
-- ============================================================
