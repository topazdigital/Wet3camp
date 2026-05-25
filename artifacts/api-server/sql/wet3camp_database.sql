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

-- Default admin account (password: Admin@Wet3Camp2026 — change immediately after first deploy)
-- Hash format: scrypt salt:hexhash — generated with: node -e "const{scrypt,randomBytes}=require('crypto');const{promisify}=require('util');promisify(scrypt)('Admin@Wet3Camp2026',randomBytes(16).toString('hex'),64).then(h=>console.log(...))"
INSERT INTO `users` (`username`, `email`, `password_hash`, `role`, `display_name`) VALUES
('admin', 'admin@wet3.camp', 'f41a49a00ddb8a18ec7e141915237793:4cbc319c9621b7635d5590f374ec2a67eca5d4535ded4fcc7444c26dc7a08cc1f87d7215c37471891643b2c8c6defede4e45af4f34004ee6fdb6a99785d91037', 'admin', 'Site Administrator');

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
-- Extra 25 profiles (IDs 26–50, diverse Kenyan cities & names)
-- ============================================================
INSERT INTO `escorts`
  (`name`,`age`,`city`,`area`,`lat`,`lng`,`tier`,`rating`,`reviews_count`,`bio`,`height`,`body_type`,`ethnicity`,`hair_color`,`price_hourly`,`price_overnight`,`price_video`,`whatsapp`,`telegram`,`available`,`verified`,`online`)
VALUES
  ('Njeri W.',    24,'Nairobi','Kileleshwa',   -1.2770, 36.7784,'elite',  4.9,167,'Kileleshwa-based elite companion. Kikuyu beauty with a sharp intellect, world-class etiquette, and an irresistible warmth.',                                 '5\'6"','Slim/Toned',    'Kikuyu',      'Black',         9500, 58000,3800,'254712345026','njeriw_wet3camp',       1,1,1),
  ('Chepkoech A.',23,'Nairobi','Spring Valley',-1.2607, 36.7620,'vip',    4.8,139,'Spring Valley VIP escort. Kalenjin beauty raised in Nairobi with a cosmopolitan outlook and an effortless sense of style.',                              '5\'7"','Athletic',      'Kalenjin',    'Natural',       6800, 42000,2600,'254712345027','chepkoeha_wet3camp',    1,1,0),
  ('Awino P.',    26,'Nairobi','Muthaiga',     -1.2450, 36.8230,'elite',  4.9,219,'Muthaiga elite — Nairobi\'s most exclusive neighbourhood hosts its most exclusive companion. Discreet, cultured, and utterly enchanting.',                 '5\'8"','Slim',          'Luo',         'Black',         11000,68000,4200,'254712345028','awinop_wet3camp',       1,1,1),
  ('Wambui K.',   28,'Nairobi','Gigiri',       -1.2290, 36.8015,'vip',    4.7,112,'UN Village area VIP escort. Fluent in 4 languages, passionate about travel and the arts. The perfect companion for events and fine dining.',               '5\'6"','Slim/Athletic', 'Kikuyu',      'Dark Brown',    7500, 46000,3000,'254712345029','wambuik_wet3camp',      0,1,0),
  ('Hafsa M.',    25,'Nairobi','South C',      -1.3120, 36.8290,'premium',4.6, 94,'South C premium companion with Somali-Kenyan heritage. Petite, stunning and exceptionally warm.',                                                         '5\'3"','Petite/Slim',   'Somali-Kenyan','Black',        4200, 27000,1700,'254712345030','hafasm_wet3camp',       1,1,1),
  ('Nyambura G.', 27,'Nairobi','Loresho',      -1.2562, 36.7520,'premium',4.5, 81,'Loresho companion combining Kikuyu heritage with a modern Nairobi upbringing. Confident, independent, and always the best-dressed in the room.',         '5\'5"','Curvy',         'Kikuyu',      'Black',         4000, 26000,1600,'254712345031','nyamburag_wet3camp',    1,0,0),
  ('Baraka L.',   22,'Nairobi','Rosslyn',      -1.2191, 36.7857,'vip',    4.7,107,'Rosslyn VIP companion — Nairobi\'s leafy suburbs are home to this radiant, educated beauty. Perfect for upscale dinner dates and private getaways.',       '5\'7"','Slim/Tall',    'Mixed-Kenyan','Natural',       7000, 44000,2800,'254712345032','barakal_wet3camp',      1,1,1),
  ('Cherotich B.',24,'Nairobi','Kyuna',        -1.2534, 36.7683,'premium',4.6, 88,'Kyuna companion with Kalenjin roots. Sporty, energetic and always full of life. Ideal for adventurous clients.',                                          '5\'6"','Athletic/Toned','Kalenjin',    'Black',         4500, 29000,1900,'254712345033','cherotichb_wet3camp',   1,1,0),
  ('Wangari N.',  29,'Nairobi','Ridgeways',    -1.2342, 36.8420,'elite',  4.8,198,'Ridgeways elite escort. Mature, elegant and deeply experienced in the art of companionship. Caters to discerning gentlemen only.',                         '5\'7"','Slim/Curvy',   'Kikuyu',      'Relaxed/Dark',  10000,62000,4000,'254712345034','wangarin_wet3camp',     1,1,1),
  ('Mukami S.',   23,'Nairobi','Brookside',    -1.2614, 36.8010,'standard',4.4, 58,'Brookside neighbourhood beauty — approachable, genuine, and absolutely worth your time.',                                                                  '5\'4"','Average',       'Kikuyu',      'Black',         2000, 12500,850, '254712345035','mukamis_wet3camp',      1,0,0),
  ('Nafula A.',   25,'Mombasa','Nyali',        -4.0051, 39.7094,'elite',  4.9,189,'Nyali elite — Luhya beauty relocated to Mombasa\'s most prestigious suburb. Sophisticated coastal lifestyle, international clientele.',                     '5\'6"','Slim',          'Luhya',       'Black',         9000, 56000,3500,'254712345036','nafula_wet3camp',       1,1,1),
  ('Amina K.',    22,'Mombasa','Shanzu',       -3.9620, 39.7210,'premium',4.6, 72,'Shanzu beach companion. Swahili beauty raised on the northern Mombasa coast.',                                                                             '5\'5"','Slim/Toned',   'Swahili',     'Black',         3800, 24000,1500,'254712345037','aminak_wet3camp',       1,1,1),
  ('Fatuma Y.',   26,'Mombasa','Tudor',        -4.0560, 39.6808,'standard',4.3, 49,'Tudor area companion offering authentic coastal experiences. Known for her infectious smile.',                                                               '5\'4"','Average',       'Swahili',     'Black',         1900, 11500,750, '254712345038','fatumay_wet3camp',      1,0,0),
  ('Zawadi M.',   28,'Mombasa','Kizingo',      -4.0663, 39.6681,'vip',    4.8,142,'Old Town Kizingo VIP escort. A treasure of the coast — Arabic-Swahili heritage, fluent Arabic and English.',                                               '5\'6"','Slim',          'Arab-Swahili','Black',         6500, 41000,2600,'254712345039','zawadim_wet3camp',      0,1,0),
  ('Mariamu B.',  24,'Mombasa','Likoni',       -4.0925, 39.6626,'standard',4.2, 36,'Likoni beauty crossing into Mombasa for her clients. Genuine, caring, and always available.',                                                              '5\'3"','Curvy',         'Swahili',     'Black',         1800, 11000,700, '254712345040','mariamub_wet3camp',     1,0,0),
  ('Atieno R.',   23,'Kisumu', 'Milimani',     -0.0960, 34.7720,'vip',    4.7,118,'Kisumu VIP companion from Milimani. Luo beauty who has studied abroad and returned with international flair.',                                               '5\'6"','Slim/Athletic', 'Luo',         'Natural',       5000, 32000,2000,'254712345041','atienor_wet3camp',      1,1,1),
  ('Auma C.',     27,'Kisumu', 'Kisumu West',  -0.1145, 34.7404,'premium',4.5, 63,'Kisumu West premium companion. Genuine lakeside warmth combined with a polished presentation.',                                                              '5\'5"','Curvy',         'Luo',         'Black',         3000, 19000,1200,'254712345042','aumac_wet3camp',        1,1,0),
  ('Adhiambo S.', 25,'Kisumu', 'Kondele',     -0.0902, 34.7853,'standard',4.3, 41,'Kondele companion offering great value to budget-conscious clients. Outgoing and full of energy.',                                                          '5\'4"','Average',       'Luo',         'Black',         1700, 10500,700, '254712345043','adhiambos_wet3camp',    1,0,0),
  ('Chebet K.',   24,'Nakuru', 'Nakuru CBD',   -0.3030, 36.0800,'premium',4.6, 78,'Nakuru CBD premium companion. Kalenjin heritage, warm smile, and a generous heart.',                                                                       '5\'5"','Slim/Toned',   'Kalenjin',    'Black',         3500, 22000,1400,'254712345044','chebet_wet3camp',       1,1,1),
  ('Nyambura T.', 26,'Nakuru', 'Lanet',        -0.2679, 36.0946,'standard',4.3, 33,'Lanet area companion in Nakuru offering genuine connections. Young, friendly and easy-going.',                                                              '5\'3"','Average',       'Kikuyu',      'Black',         1700, 10000,650, '254712345045','nyamburate_wet3camp',   1,0,0),
  ('Purity M.',   23,'Nakuru', 'Milimani Nakuru',-0.2882,36.0610,'vip',   4.7, 95,'Nakuru Milimani VIP escort. University graduate who decided she enjoys companionship above the corporate world.',                                           '5\'6"','Slim',          'Kikuyu',      'Dark Brown',    5000, 31000,2000,'254712345046','puritym_wet3camp',      1,1,1),
  ('Lagat C.',    25,'Eldoret','Langas',        0.5043, 35.2690,'premium',4.5, 55,'Langas, Eldoret premium companion. Kalenjin athlete with a stunning figure and warm personality.',                                                           '5\'7"','Athletic/Slim', 'Kalenjin',    'Black',         3200, 20000,1300,'254712345047','lagatc_wet3camp',       1,1,0),
  ('Cherop N.',   22,'Eldoret','Eldoret CBD',   0.5143, 35.2698,'standard',4.4, 29,'Eldoret CBD companion. Fresh on the platform but quickly earning rave reviews for her cheerful nature.',                                                   '5\'5"','Average',       'Kalenjin',    'Black',         1900, 11000,750, '254712345048','chero_wet3camp',        1,0,0),
  ('Nashipai L.', 27,'Nairobi','Ngong',        -1.3649, 36.6580,'premium',4.6, 82,'Ngong Hills area companion with a Maasai heritage. Tall, striking, and utterly unforgettable.',                                                             '5\'9"','Slim/Tall',    'Maasai',      'Black',         4200, 27000,1700,'254712345049','nashipail_wet3camp',    1,1,1),
  ('Kavata M.',   24,'Nairobi','Machakos Town',(-37.2596),(37.2596),'standard',4.3, 45,'Machakos-based companion willing to visit Nairobi. Kamba beauty with a bubbly personality and great reviews.',                                         '5\'4"','Average',       'Kamba',       'Black',         2000, 12000,800, '254712345050','kavatam_wet3camp',      1,0,0);

-- ============================================================
-- Seed escort services (IDs 1–50)
-- VIP_SERVICES for elite/vip (IDs 1,2,3,6,8,10,15,16,17,18,19,21,24,26,27,28,29,32,34,36,37,41,46,49)
-- Standard services for rest
-- ============================================================
INSERT INTO `escort_services` (`escort_id`,`name`,`available`) VALUES
-- Escort 1 (elite)
(1,'Dinner Dates',1),(1,'Video Calls',1),(1,'Overnight',1),(1,'Out-Call',1),(1,'Travel Companion',1),(1,'Events & Functions',1),(1,'Hotel Visits',1),
-- Escort 2 (vip)
(2,'Dinner Dates',1),(2,'Video Calls',1),(2,'Overnight',1),(2,'Out-Call',1),(2,'Travel Companion',1),(2,'Events & Functions',1),(2,'Hotel Visits',1),
-- Escort 3 (vip)
(3,'Dinner Dates',1),(3,'Video Calls',1),(3,'Overnight',1),(3,'Out-Call',1),(3,'Travel Companion',1),(3,'Events & Functions',1),(3,'Hotel Visits',1),
-- Escort 4 (premium)
(4,'Dinner Dates',1),(4,'Video Calls',1),(4,'Overnight',1),(4,'Out-Call',1),(4,'Travel Companion',0),(4,'Events & Functions',0),
-- Escort 5 (premium)
(5,'Dinner Dates',1),(5,'Video Calls',1),(5,'Overnight',1),(5,'Out-Call',1),(5,'Travel Companion',1),(5,'Events & Functions',1),(5,'Hotel Visits',1),
-- Escort 6 (elite)
(6,'Dinner Dates',1),(6,'Video Calls',1),(6,'Overnight',1),(6,'Out-Call',1),(6,'Travel Companion',1),(6,'Events & Functions',1),(6,'Hotel Visits',1),
-- Escort 7 (premium)
(7,'Dinner Dates',1),(7,'Video Calls',1),(7,'Overnight',1),(7,'Out-Call',1),(7,'Travel Companion',0),(7,'Events & Functions',0),
-- Escort 8 (vip)
(8,'Dinner Dates',1),(8,'Video Calls',1),(8,'Overnight',1),(8,'Out-Call',1),(8,'Travel Companion',1),(8,'Events & Functions',1),(8,'Hotel Visits',1),
-- Escort 9–25 (standard/premium — standard services)
(9,'Dinner Dates',1),(9,'Video Calls',1),(9,'Overnight',1),(9,'Out-Call',1),(9,'Travel Companion',0),(9,'Events & Functions',0),
(10,'Dinner Dates',1),(10,'Video Calls',1),(10,'Overnight',1),(10,'Out-Call',1),(10,'Travel Companion',1),(10,'Events & Functions',1),(10,'Hotel Visits',1),
(11,'Dinner Dates',1),(11,'Video Calls',1),(11,'Overnight',1),(11,'Out-Call',1),(11,'Travel Companion',0),(11,'Events & Functions',0),
(12,'Dinner Dates',1),(12,'Video Calls',1),(12,'Overnight',1),(12,'Out-Call',1),(12,'Travel Companion',0),(12,'Events & Functions',0),
(13,'Dinner Dates',1),(13,'Video Calls',1),(13,'Overnight',0),(13,'Out-Call',1),(13,'Travel Companion',0),(13,'Events & Functions',0),
(14,'Dinner Dates',1),(14,'Video Calls',1),(14,'Overnight',1),(14,'Out-Call',1),(14,'Travel Companion',0),(14,'Events & Functions',0),
(15,'Dinner Dates',1),(15,'Video Calls',1),(15,'Overnight',1),(15,'Out-Call',1),(15,'Travel Companion',1),(15,'Events & Functions',1),(15,'Hotel Visits',1),
(16,'Dinner Dates',1),(16,'Video Calls',1),(16,'Overnight',1),(16,'Out-Call',1),(16,'Travel Companion',1),(16,'Events & Functions',1),(16,'Hotel Visits',1),
(17,'Dinner Dates',1),(17,'Video Calls',1),(17,'Overnight',1),(17,'Out-Call',1),(17,'Travel Companion',0),(17,'Events & Functions',0),
(18,'Dinner Dates',1),(18,'Video Calls',1),(18,'Overnight',1),(18,'Out-Call',1),(18,'Travel Companion',1),(18,'Events & Functions',1),(18,'Hotel Visits',1),
(19,'Dinner Dates',1),(19,'Video Calls',1),(19,'Overnight',1),(19,'Out-Call',1),(19,'Travel Companion',1),(19,'Events & Functions',1),(19,'Hotel Visits',1),
(20,'Dinner Dates',1),(20,'Video Calls',1),(20,'Overnight',1),(20,'Out-Call',1),(20,'Travel Companion',0),(20,'Events & Functions',0),
(21,'Dinner Dates',1),(21,'Video Calls',1),(21,'Overnight',1),(21,'Out-Call',1),(21,'Travel Companion',0),(21,'Events & Functions',0),
(22,'Dinner Dates',1),(22,'Video Calls',1),(22,'Overnight',0),(22,'Out-Call',1),(22,'Travel Companion',0),(22,'Events & Functions',0),
(23,'Dinner Dates',1),(23,'Video Calls',1),(23,'Overnight',1),(23,'Out-Call',1),(23,'Travel Companion',0),(23,'Events & Functions',0),
(24,'Dinner Dates',1),(24,'Video Calls',1),(24,'Overnight',1),(24,'Out-Call',1),(24,'Travel Companion',1),(24,'Events & Functions',1),(24,'Hotel Visits',1),
(25,'Dinner Dates',1),(25,'Video Calls',1),(25,'Overnight',0),(25,'Out-Call',1),(25,'Travel Companion',0),(25,'Events & Functions',0);

-- ============================================================
-- Seed escort languages
-- ============================================================
INSERT INTO `escort_languages` (`escort_id`,`language`) VALUES
(1,'English'),(1,'Swahili'),
(2,'English'),(2,'Swahili'),(2,'French'),
(3,'English'),(3,'Swahili'),
(4,'English'),(4,'Swahili'),(4,'Kikuyu'),
(5,'English'),(5,'Hindi'),(5,'Swahili'),
(6,'English'),(6,'Swahili'),(6,'Arabic'),
(7,'English'),(7,'Swahili'),
(8,'English'),(8,'Swahili'),(8,'German'),
(9,'English'),(9,'Swahili'),(9,'Luo'),
(10,'English'),(10,'French'),(10,'Swahili'),
(11,'English'),(11,'Swahili'),
(12,'English'),(12,'Swahili'),(12,'Somali'),
(13,'English'),(13,'Swahili'),
(14,'English'),(14,'Swahili'),
(15,'English'),(15,'Swahili'),(15,'Kikuyu'),
(16,'English'),(16,'Swahili'),(16,'Portuguese'),
(17,'English'),(17,'Swahili'),(17,'Luo'),
(18,'English'),(18,'Swahili'),(18,'Arabic'),
(19,'English'),(19,'Swahili'),(19,'Italian'),
(20,'English'),(20,'Swahili'),
(21,'English'),(21,'Swahili'),(21,'Luo'),
(22,'English'),(22,'Swahili'),(22,'Luo'),
(23,'English'),(23,'Swahili'),(23,'Kikuyu'),
(24,'English'),(24,'Swahili'),
(25,'English'),(25,'Swahili'),(25,'Kalenjin'),
(26,'English'),(26,'Swahili'),(26,'Kikuyu'),
(27,'English'),(27,'Swahili'),(27,'Kalenjin'),
(28,'English'),(28,'Swahili'),(28,'Luo'),(28,'French'),
(29,'English'),(29,'Swahili'),(29,'Kikuyu'),(29,'German'),
(30,'English'),(30,'Swahili'),(30,'Somali'),
(31,'English'),(31,'Swahili'),(31,'Kikuyu'),
(32,'English'),(32,'Swahili'),(32,'French'),
(33,'English'),(33,'Swahili'),(33,'Kalenjin'),
(34,'English'),(34,'Swahili'),(34,'Kikuyu'),(34,'French'),
(35,'English'),(35,'Swahili'),(35,'Kikuyu'),
(36,'English'),(36,'Swahili'),(36,'Luhya'),
(37,'English'),(37,'Swahili'),
(38,'English'),(38,'Swahili'),
(39,'English'),(39,'Swahili'),(39,'Arabic'),
(40,'English'),(40,'Swahili'),
(41,'English'),(41,'Swahili'),(41,'Luo'),(41,'French'),
(42,'English'),(42,'Swahili'),(42,'Luo'),
(43,'English'),(43,'Swahili'),(43,'Luo'),
(44,'English'),(44,'Swahili'),(44,'Kalenjin'),
(45,'English'),(45,'Swahili'),(45,'Kikuyu'),
(46,'English'),(46,'Swahili'),(46,'Kikuyu'),
(47,'English'),(47,'Swahili'),(47,'Kalenjin'),
(48,'English'),(48,'Swahili'),(48,'Kalenjin'),
(49,'English'),(49,'Swahili'),(49,'Maasai'),
(50,'English'),(50,'Swahili'),(50,'Kamba');

-- ============================================================
-- Seed gallery images for first 25 escorts (6 photos each)
-- ============================================================
INSERT INTO `escort_gallery` (`escort_id`,`image_url`,`sort_order`) VALUES
(1,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face',1),
(1,'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&crop=face',2),
(1,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&crop=face',3),
(2,'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop&crop=face',1),
(2,'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&crop=face',2),
(2,'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face',3),
(3,'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop&crop=face',1),
(3,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face',2),
(3,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&crop=face',3),
(4,'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop&crop=face',1),
(4,'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face',2),
(4,'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&crop=face',3),
(5,'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=300&h=400&fit=crop&crop=face',1),
(5,'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&h=400&fit=crop&crop=face',2),
(5,'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&h=400&fit=crop&crop=face',3),
(6,'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop&crop=face',1),
(6,'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=300&h=400&fit=crop&crop=face',2),
(6,'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=300&h=400&fit=crop&crop=face',3),
(7,'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop&crop=face',1),
(7,'https://images.unsplash.com/photo-1552699611-b4cc0e76bc3f?w=300&h=400&fit=crop&crop=face',2),
(7,'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=300&h=400&fit=crop&crop=face',3),
(8,'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=400&fit=crop&crop=face',1),
(8,'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&h=400&fit=crop&crop=face',2),
(8,'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&h=400&fit=crop&crop=face',3);

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
