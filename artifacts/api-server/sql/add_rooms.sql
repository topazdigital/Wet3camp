-- ============================================================
-- Migration: add_rooms.sql
-- Run once on the server:
--   mysql -u admin_betcheza -p admin_wet3camp < add_rooms.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS `rooms` (
  `id`            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(200) NOT NULL,
  `hotel`         VARCHAR(200) NOT NULL,
  `city`          VARCHAR(100) NOT NULL,
  `area`          VARCHAR(100) NOT NULL,
  `type`          VARCHAR(50)  NOT NULL DEFAULT 'Standard',
  `price_night`   INT UNSIGNED NOT NULL DEFAULT 0,
  `price_hourly`  INT UNSIGNED NOT NULL DEFAULT 0,
  `rating`        DECIMAL(2,1) NOT NULL DEFAULT 0.0,
  `reviews_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `amenities`     TEXT DEFAULT NULL,
  `image`         VARCHAR(500) DEFAULT NULL,
  `available`     TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_city`      (`city`),
  INDEX `idx_type`      (`type`),
  INDEX `idx_available` (`available`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `rooms`
  (`id`,`name`,`hotel`,`city`,`area`,`type`,`price_night`,`price_hourly`,`rating`,`reviews_count`,`amenities`,`image`,`available`)
VALUES
  (1,'Sankara Suite',     'Sankara Hotel',        'Nairobi', 'Westlands',   'Suite',    15000,2000,4.9,234,'WiFi, Parking, Breakfast, 24hr Security, Pool','https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=250&fit=crop',1),
  (2,'Radisson Deluxe',   'Radisson Blu',         'Nairobi', 'Upperhill',   'Deluxe',   12000,1500,4.8,189,'WiFi, Parking, Gym, Restaurant',               'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop',1),
  (3,'Serena Executive',  'Serena Hotel',         'Nairobi', 'Nairobi CBD', 'Executive',18000,2500,5.0,312,'WiFi, Valet, Pool, Spa, Restaurant',           'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=250&fit=crop',0),
  (4,'Nyali Beach Villa', 'Nyali Beach Hotel',    'Mombasa', 'Nyali',       'Villa',    10000,1800,4.7,145,'WiFi, Parking, Beach Access, Pool',            'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=250&fit=crop',1),
  (5,'PrideInn Waterfront','PrideInn Mombasa',   'Mombasa', 'Mombasa CBD', 'Standard',  8000,1200,4.5, 98,'WiFi, Parking, Restaurant',                   'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=400&h=250&fit=crop',1),
  (6,'Milimani VIP Room', 'Milimani Hotel',       'Kisumu',  'Milimani',    'VIP',       6000,1000,4.4, 67,'WiFi, Parking, Breakfast',                    'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=400&h=250&fit=crop',1);
