-- =============================================================
-- Wet3 Camp — MySQL Database Schema
-- Engine: InnoDB | Charset: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =============================================================

CREATE DATABASE IF NOT EXISTS wet3camp CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE wet3camp;

-- ----------------------------------------------------------------
-- 1. USERS (authentication + base identity)
-- ----------------------------------------------------------------
CREATE TABLE users (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username       VARCHAR(50)  NOT NULL UNIQUE,
  email          VARCHAR(191) NOT NULL UNIQUE,
  password_hash  VARCHAR(255) NOT NULL,
  role           ENUM('client','escort','admin','moderator') NOT NULL DEFAULT 'client',
  is_verified    TINYINT(1)   NOT NULL DEFAULT 0,
  is_active      TINYINT(1)   NOT NULL DEFAULT 1,
  is_banned      TINYINT(1)   NOT NULL DEFAULT 0,
  avatar_url     VARCHAR(500) NULL,
  phone          VARCHAR(20)  NULL,
  last_login_at  DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email        (email),
  INDEX idx_role         (role),
  INDEX idx_is_active    (is_active)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 2. PROFILES (escort profile details)
-- ----------------------------------------------------------------
CREATE TABLE profiles (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
  display_name    VARCHAR(100) NOT NULL,
  age             TINYINT UNSIGNED NOT NULL,
  gender          ENUM('female','male','non-binary','trans') NOT NULL DEFAULT 'female',
  location        VARCHAR(200) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  country         VARCHAR(100) NOT NULL DEFAULT 'Kenya',
  bio             TEXT         NULL,
  badge_level     ENUM('free','premium','vip','elite') NOT NULL DEFAULT 'free',
  price_per_hour  INT UNSIGNED NOT NULL DEFAULT 0,
  is_available    TINYINT(1)   NOT NULL DEFAULT 1,
  is_featured     TINYINT(1)   NOT NULL DEFAULT 0,
  is_verified     TINYINT(1)   NOT NULL DEFAULT 0,
  primary_image   VARCHAR(500) NULL,
  views_count     INT UNSIGNED NOT NULL DEFAULT 0,
  rating_avg      DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count    INT UNSIGNED NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_city           (city),
  INDEX idx_badge_level    (badge_level),
  INDEX idx_is_available   (is_available),
  INDEX idx_is_featured    (is_featured),
  INDEX idx_rating_avg     (rating_avg)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 3. PROFILE IMAGES
-- ----------------------------------------------------------------
CREATE TABLE profile_images (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id  BIGINT UNSIGNED NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  is_primary  TINYINT(1)   NOT NULL DEFAULT 0,
  sort_order  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 4. PROFILE SERVICES (what each escort offers)
-- ----------------------------------------------------------------
CREATE TABLE profile_services (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id  BIGINT UNSIGNED NOT NULL,
  service     VARCHAR(100) NOT NULL,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_profile_service (profile_id, service)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 5. BOOKINGS
-- ----------------------------------------------------------------
CREATE TABLE bookings (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id     BIGINT UNSIGNED NOT NULL,
  profile_id    BIGINT UNSIGNED NOT NULL,
  booked_date   DATE         NOT NULL,
  booked_time   TIME         NOT NULL,
  duration_hrs  DECIMAL(4,1) NOT NULL DEFAULT 1.0,
  total_price   INT UNSIGNED NOT NULL,
  location_note VARCHAR(500) NULL,
  status        ENUM('pending','confirmed','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'pending',
  payment_method ENUM('mpesa','card','cash') NULL,
  payment_ref   VARCHAR(100) NULL,
  notes         TEXT         NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id)  REFERENCES users(id)    ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_client_id    (client_id),
  INDEX idx_profile_id   (profile_id),
  INDEX idx_status       (status),
  INDEX idx_booked_date  (booked_date)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 6. CONVERSATIONS
-- ----------------------------------------------------------------
CREATE TABLE conversations (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  participant_a   BIGINT UNSIGNED NOT NULL,
  participant_b   BIGINT UNSIGNED NOT NULL,
  last_message_id BIGINT UNSIGNED NULL,
  unread_a        INT UNSIGNED NOT NULL DEFAULT 0,
  unread_b        INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (participant_b) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_participants (participant_a, participant_b),
  INDEX idx_participant_a (participant_a),
  INDEX idx_participant_b (participant_b),
  INDEX idx_updated_at    (updated_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 7. MESSAGES
-- ----------------------------------------------------------------
CREATE TABLE messages (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  conversation_id  BIGINT UNSIGNED NOT NULL,
  sender_id        BIGINT UNSIGNED NOT NULL,
  content          TEXT NOT NULL,
  media_url        VARCHAR(500) NULL,
  media_type       ENUM('image','video','audio') NULL,
  is_read          TINYINT(1)   NOT NULL DEFAULT 0,
  read_at          DATETIME     NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE,
  INDEX idx_conversation_id (conversation_id),
  INDEX idx_sender_id       (sender_id),
  INDEX idx_created_at      (created_at)
) ENGINE=InnoDB;

-- Update last_message_id FK after messages table exists
ALTER TABLE conversations ADD CONSTRAINT fk_last_message
  FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------
-- 8. REVIEWS
-- ----------------------------------------------------------------
CREATE TABLE reviews (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reviewer_id  BIGINT UNSIGNED NOT NULL,
  profile_id   BIGINT UNSIGNED NOT NULL,
  booking_id   BIGINT UNSIGNED NULL,
  rating       TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body         TEXT NULL,
  is_approved  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reviewer_id) REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (profile_id)  REFERENCES profiles(id)  ON DELETE CASCADE,
  FOREIGN KEY (booking_id)  REFERENCES bookings(id)  ON DELETE SET NULL,
  UNIQUE KEY uq_reviewer_profile (reviewer_id, profile_id),
  INDEX idx_profile_id  (profile_id),
  INDEX idx_is_approved (is_approved)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 9. LIVE STREAMS
-- ----------------------------------------------------------------
CREATE TABLE live_streams (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id     BIGINT UNSIGNED NOT NULL,
  title          VARCHAR(200) NOT NULL,
  thumbnail_url  VARCHAR(500) NULL,
  stream_key     VARCHAR(100) NULL UNIQUE,
  viewer_count   INT UNSIGNED NOT NULL DEFAULT 0,
  peak_viewers   INT UNSIGNED NOT NULL DEFAULT 0,
  is_live        TINYINT(1)   NOT NULL DEFAULT 0,
  is_private     TINYINT(1)   NOT NULL DEFAULT 0,
  started_at     DATETIME     NULL,
  ended_at       DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_is_live    (is_live),
  INDEX idx_profile_id (profile_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 10. FEED POSTS
-- ----------------------------------------------------------------
CREATE TABLE feed_posts (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id   BIGINT UNSIGNED NOT NULL,
  caption      TEXT NULL,
  media_url    VARCHAR(500) NULL,
  media_type   ENUM('image','video','gallery') NULL,
  likes_count  INT UNSIGNED NOT NULL DEFAULT 0,
  views_count  INT UNSIGNED NOT NULL DEFAULT 0,
  is_premium   TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 11. FEED LIKES
-- ----------------------------------------------------------------
CREATE TABLE feed_likes (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  post_id    BIGINT UNSIGNED NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)       ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES feed_posts(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_user_post (user_id, post_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 12. EVENTS
-- ----------------------------------------------------------------
CREATE TABLE events (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title           VARCHAR(200) NOT NULL,
  description     TEXT NULL,
  category        VARCHAR(50)  NOT NULL DEFAULT 'Social',
  event_date      DATETIME     NOT NULL,
  location        VARCHAR(300) NOT NULL,
  city            VARCHAR(100) NOT NULL,
  price           INT UNSIGNED NOT NULL DEFAULT 0,
  capacity        INT UNSIGNED NULL,
  attendees_count INT UNSIGNED NOT NULL DEFAULT 0,
  image_url       VARCHAR(500) NULL,
  organizer_id    BIGINT UNSIGNED NULL,
  is_published    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_event_date  (event_date),
  INDEX idx_city        (city),
  INDEX idx_is_published (is_published)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 13. EVENT ATTENDEES
-- ----------------------------------------------------------------
CREATE TABLE event_attendees (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id   BIGINT UNSIGNED NOT NULL,
  user_id    BIGINT UNSIGNED NOT NULL,
  status     ENUM('going','maybe','cancelled') NOT NULL DEFAULT 'going',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  UNIQUE KEY uq_event_user (event_id, user_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 14. ROOMS
-- ----------------------------------------------------------------
CREATE TABLE rooms (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(200) NOT NULL,
  description      TEXT NULL,
  location         VARCHAR(300) NOT NULL,
  city             VARCHAR(100) NOT NULL,
  price_per_night  INT UNSIGNED NOT NULL,
  capacity         TINYINT UNSIGNED NOT NULL DEFAULT 2,
  amenities        JSON         NULL,
  images           JSON         NULL,
  is_available     TINYINT(1)   NOT NULL DEFAULT 1,
  rating_avg       DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  rating_count     INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city        (city),
  INDEX idx_is_available (is_available)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 15. ROOM BOOKINGS
-- ----------------------------------------------------------------
CREATE TABLE room_bookings (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  room_id     BIGINT UNSIGNED NOT NULL,
  user_id     BIGINT UNSIGNED NOT NULL,
  check_in    DATE         NOT NULL,
  check_out   DATE         NOT NULL,
  guests      TINYINT UNSIGNED NOT NULL DEFAULT 1,
  total_price INT UNSIGNED NOT NULL,
  status      ENUM('pending','confirmed','checked_in','checked_out','cancelled') NOT NULL DEFAULT 'pending',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_room_id   (room_id),
  INDEX idx_check_in  (check_in)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 16. TOURS
-- ----------------------------------------------------------------
CREATE TABLE tours (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  escort_id     BIGINT UNSIGNED NOT NULL,
  destination   VARCHAR(200) NOT NULL,
  description   TEXT NULL,
  duration_days TINYINT UNSIGNED NOT NULL DEFAULT 1,
  price         INT UNSIGNED NOT NULL,
  max_guests    TINYINT UNSIGNED NOT NULL DEFAULT 1,
  is_available  TINYINT(1)   NOT NULL DEFAULT 1,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (escort_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_escort_id  (escort_id),
  INDEX idx_is_available (is_available)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 17. SHOP PRODUCTS
-- ----------------------------------------------------------------
CREATE TABLE shop_products (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  description  TEXT NULL,
  category     VARCHAR(100) NOT NULL,
  price        INT UNSIGNED NOT NULL,
  stock        INT UNSIGNED NOT NULL DEFAULT 0,
  image_url    VARCHAR(500) NULL,
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  rating_avg   DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_category  (category),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 18. SHOP ORDERS
-- ----------------------------------------------------------------
CREATE TABLE shop_orders (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  total_amount    INT UNSIGNED NOT NULL,
  status          ENUM('pending','paid','shipped','delivered','refunded','cancelled') NOT NULL DEFAULT 'pending',
  shipping_address TEXT NULL,
  payment_method  ENUM('mpesa','card','cod') NULL,
  payment_ref     VARCHAR(100) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status  (status)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 19. SHOP ORDER ITEMS
-- ----------------------------------------------------------------
CREATE TABLE shop_order_items (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id    BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  quantity    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  unit_price  INT UNSIGNED NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES shop_orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 20. CART ITEMS
-- ----------------------------------------------------------------
CREATE TABLE cart_items (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  product_id  BIGINT UNSIGNED NOT NULL,
  quantity    SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  added_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_product (user_id, product_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 21. FAVORITES
-- ----------------------------------------------------------------
CREATE TABLE favorites (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  profile_id  BIGINT UNSIGNED NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id)     ON DELETE CASCADE,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_profile (user_id, profile_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 22. BLACKLIST
-- ----------------------------------------------------------------
CREATE TABLE blacklist (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reported_user   VARCHAR(200) NOT NULL,
  user_id         BIGINT UNSIGNED NULL,
  reason          TEXT         NOT NULL,
  reported_by     BIGINT UNSIGNED NULL,
  reports_count   INT UNSIGNED NOT NULL DEFAULT 1,
  is_confirmed    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_reports_count (reports_count)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 23. TESTIMONIALS
-- ----------------------------------------------------------------
CREATE TABLE testimonials (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NULL,
  author_name VARCHAR(100) NOT NULL,
  author_role VARCHAR(100) NULL,
  content     TEXT         NOT NULL,
  rating      TINYINT UNSIGNED NOT NULL DEFAULT 5,
  is_approved TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 24. ADVERTS
-- ----------------------------------------------------------------
CREATE TABLE adverts (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id  BIGINT UNSIGNED NOT NULL,
  headline    VARCHAR(200) NOT NULL,
  tier        ENUM('basic','featured','premium','elite') NOT NULL DEFAULT 'basic',
  views_count INT UNSIGNED NOT NULL DEFAULT 0,
  clicks      INT UNSIGNED NOT NULL DEFAULT 0,
  starts_at   DATETIME     NOT NULL,
  expires_at  DATETIME     NOT NULL,
  is_active   TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_is_active  (is_active),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 25. NOTIFICATIONS
-- ----------------------------------------------------------------
CREATE TABLE notifications (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  type        ENUM('booking','message','review','system','promo','live') NOT NULL,
  title       VARCHAR(200) NOT NULL,
  body        TEXT NULL,
  action_url  VARCHAR(500) NULL,
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id  (user_id),
  INDEX idx_is_read  (is_read),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 26. ADMINS / MODERATORS
-- ----------------------------------------------------------------
CREATE TABLE admin_roles (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL UNIQUE,
  role        ENUM('super_admin','admin','moderator','support') NOT NULL DEFAULT 'moderator',
  permissions JSON NULL,
  created_by  BIGINT UNSIGNED NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 27. VERIFICATION REQUESTS
-- ----------------------------------------------------------------
CREATE TABLE verification_requests (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  id_type     ENUM('national_id','passport','drivers_license') NOT NULL,
  id_front    VARCHAR(500) NOT NULL,
  id_back     VARCHAR(500) NULL,
  selfie_url  VARCHAR(500) NULL,
  status      ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by BIGINT UNSIGNED NULL,
  notes       TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------
-- 28. VIDEOS
-- ----------------------------------------------------------------
CREATE TABLE videos (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id   BIGINT UNSIGNED NOT NULL,
  title        VARCHAR(200) NOT NULL,
  description  TEXT NULL,
  video_url    VARCHAR(500) NOT NULL,
  thumbnail    VARCHAR(500) NULL,
  duration_sec INT UNSIGNED NULL,
  views_count  INT UNSIGNED NOT NULL DEFAULT 0,
  is_premium   TINYINT(1)   NOT NULL DEFAULT 0,
  price        INT UNSIGNED NOT NULL DEFAULT 0,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_id (profile_id),
  INDEX idx_is_premium (is_premium)
) ENGINE=InnoDB;
