-- PostgreSQL schema for Replit dev environment
-- Converted from artifacts/wet3camp-migration.sql (MySQL → PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(100)        NOT NULL,
  email         VARCHAR(255)        NOT NULL,
  password_hash VARCHAR(255)        NOT NULL,
  display_name  VARCHAR(150)        DEFAULT NULL,
  phone         VARCHAR(30)         DEFAULT NULL,
  role          VARCHAR(20)         NOT NULL DEFAULT 'user',
  avatar        VARCHAR(500)        DEFAULT NULL,
  is_active     SMALLINT            NOT NULL DEFAULT 1,
  created_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP           NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_email    UNIQUE (email),
  CONSTRAINT uq_username UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS escorts (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER          DEFAULT NULL,
  name             VARCHAR(100)     NOT NULL,
  age              SMALLINT         NOT NULL DEFAULT 0,
  city             VARCHAR(100)     NOT NULL DEFAULT '',
  area             VARCHAR(100)     NOT NULL DEFAULT '',
  lat              DECIMAL(9,6)     NOT NULL DEFAULT 0,
  lng              DECIMAL(9,6)     NOT NULL DEFAULT 0,
  tier             VARCHAR(20)      NOT NULL DEFAULT 'standard',
  rating           DECIMAL(2,1)     NOT NULL DEFAULT 0.0,
  reviews_count    SMALLINT         NOT NULL DEFAULT 0,
  bio              TEXT             DEFAULT NULL,
  image            VARCHAR(500)     DEFAULT NULL,
  height           VARCHAR(20)      DEFAULT NULL,
  body_type        VARCHAR(50)      DEFAULT NULL,
  ethnicity        VARCHAR(50)      DEFAULT NULL,
  hair_color       VARCHAR(50)      DEFAULT NULL,
  gender           VARCHAR(30)      NOT NULL DEFAULT 'Female',
  price_hourly     INTEGER          NOT NULL DEFAULT 0,
  price_overnight  INTEGER          NOT NULL DEFAULT 0,
  price_video      INTEGER          NOT NULL DEFAULT 0,
  price_incall     INTEGER          NOT NULL DEFAULT 0,
  price_outcall    INTEGER          NOT NULL DEFAULT 0,
  whatsapp         VARCHAR(20)      DEFAULT NULL,
  telegram         VARCHAR(100)     DEFAULT NULL,
  phone            VARCHAR(20)      DEFAULT NULL,
  available        SMALLINT         NOT NULL DEFAULT 0,
  verified         SMALLINT         NOT NULL DEFAULT 0,
  online           SMALLINT         NOT NULL DEFAULT 0,
  featured         SMALLINT         NOT NULL DEFAULT 0,
  price_incall_overnight INTEGER     NOT NULL DEFAULT 0,
  price_outcall_overnight INTEGER    NOT NULL DEFAULT 0,
  instagram        VARCHAR(100)     DEFAULT NULL,
  facebook         VARCHAR(100)     DEFAULT NULL,
  is_active        SMALLINT         NOT NULL DEFAULT 1,
  created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_escorts_user_id ON escorts (user_id);
CREATE INDEX IF NOT EXISTS idx_escorts_city    ON escorts (city);
CREATE INDEX IF NOT EXISTS idx_escorts_tier    ON escorts (tier);

CREATE TABLE IF NOT EXISTS platform_settings (
  key        VARCHAR(100)  NOT NULL,
  value      TEXT          NOT NULL DEFAULT '',
  updated_at TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (key)
);

CREATE TABLE IF NOT EXISTS escort_gallery (
  id          SERIAL PRIMARY KEY,
  escort_id   INTEGER      NOT NULL,
  image_url   VARCHAR(500) NOT NULL,
  sort_order  INTEGER      NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_escort_gallery_escort_id ON escort_gallery (escort_id);

CREATE TABLE IF NOT EXISTS escort_languages (
  id         SERIAL PRIMARY KEY,
  escort_id  INTEGER     NOT NULL,
  language   VARCHAR(50) NOT NULL,
  CONSTRAINT uq_escort_lang UNIQUE (escort_id, language)
);
CREATE INDEX IF NOT EXISTS idx_escort_languages_escort_id ON escort_languages (escort_id);

CREATE TABLE IF NOT EXISTS escort_services (
  id         SERIAL PRIMARY KEY,
  escort_id  INTEGER      NOT NULL,
  name       VARCHAR(100) NOT NULL,
  available  SMALLINT     NOT NULL DEFAULT 1,
  CONSTRAINT uq_escort_svc UNIQUE (escort_id, name)
);
CREATE INDEX IF NOT EXISTS idx_escort_services_escort_id ON escort_services (escort_id);

CREATE TABLE IF NOT EXISTS rooms (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150)    NOT NULL,
  hotel         VARCHAR(150)    NOT NULL,
  city          VARCHAR(80)     NOT NULL,
  area          VARCHAR(80)     NOT NULL,
  type          VARCHAR(50)     NOT NULL DEFAULT 'Standard',
  price_night   INTEGER         NOT NULL DEFAULT 0,
  price_hourly  INTEGER         NOT NULL DEFAULT 0,
  rating        DECIMAL(3,1)    NOT NULL DEFAULT 0.0,
  reviews_count INTEGER         NOT NULL DEFAULT 0,
  amenities     TEXT,
  image         VARCHAR(500),
  available     SMALLINT        NOT NULL DEFAULT 1,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS room_bookings (
  id           SERIAL PRIMARY KEY,
  room_id      INTEGER      NOT NULL,
  guest_name   VARCHAR(150) NOT NULL,
  guest_email  VARCHAR(255) NOT NULL,
  guest_phone  VARCHAR(30),
  check_in     DATE         NOT NULL,
  check_out    DATE         NOT NULL,
  nights       INTEGER      NOT NULL DEFAULT 1,
  guests       INTEGER      NOT NULL DEFAULT 1,
  total_amount INTEGER      NOT NULL DEFAULT 0,
  notes        TEXT,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_room_bookings_room_id  ON room_bookings (room_id);
CREATE INDEX IF NOT EXISTS idx_room_bookings_check_in ON room_bookings (check_in);
CREATE INDEX IF NOT EXISTS idx_room_bookings_status   ON room_bookings (status);

CREATE TABLE IF NOT EXISTS bookings (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER      NOT NULL,
  escort_id    INTEGER      NOT NULL,
  booking_date DATE         NOT NULL,
  start_time   TIME         NOT NULL,
  duration_hrs SMALLINT     NOT NULL DEFAULT 1,
  type         VARCHAR(20)  NOT NULL DEFAULT 'hourly',
  amount       INTEGER      NOT NULL DEFAULT 0,
  location     VARCHAR(300) DEFAULT NULL,
  notes        TEXT         DEFAULT NULL,
  status       VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_escort_id ON bookings (escort_id);

CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  token      VARCHAR(100) NOT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets (token);
CREATE INDEX IF NOT EXISTS idx_password_resets_email ON password_resets (email);

CREATE TABLE IF NOT EXISTS reviews (
  id         SERIAL PRIMARY KEY,
  escort_id  INTEGER      NOT NULL,
  user_id    INTEGER      NOT NULL,
  rating     SMALLINT     NOT NULL DEFAULT 5,
  comment    TEXT,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_reviews_escort_id ON reviews (escort_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id   ON reviews (user_id);

CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER  NOT NULL,
  escort_id  INTEGER  NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_fav UNIQUE (user_id, escort_id)
);

CREATE TABLE IF NOT EXISTS followers (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL,
  escort_id  INTEGER   NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_follow UNIQUE (user_id, escort_id)
);

CREATE TABLE IF NOT EXISTS adverts (
  id          SERIAL PRIMARY KEY,
  escort_id   INTEGER      DEFAULT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT         DEFAULT NULL,
  image       VARCHAR(500) DEFAULT NULL,
  link        VARCHAR(500) DEFAULT NULL,
  position    VARCHAR(20)  NOT NULL DEFAULT 'banner',
  is_active   SMALLINT     NOT NULL DEFAULT 1,
  starts_at   TIMESTAMP    DEFAULT NULL,
  ends_at     TIMESTAMP    DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blacklist (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  phone       VARCHAR(20)  DEFAULT NULL,
  reason      TEXT         NOT NULL,
  reported_by INTEGER      DEFAULT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id          SERIAL PRIMARY KEY,
  sender_id   INTEGER   NOT NULL,
  receiver_id INTEGER   NOT NULL,
  body        TEXT      NOT NULL,
  read        SMALLINT  NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_sender   ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver ON messages (receiver_id);

CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL,
  type       VARCHAR(50)  NOT NULL DEFAULT 'system',
  text       VARCHAR(500) NOT NULL DEFAULT '',
  link       VARCHAR(300) NOT NULL DEFAULT '/',
  dot        VARCHAR(20)  NOT NULL DEFAULT '#8B0000',
  avatar     VARCHAR(500) DEFAULT NULL,
  read_at    TIMESTAMP    DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications (read_at);

CREATE TABLE IF NOT EXISTS sessions (
  id         VARCHAR(128) NOT NULL,
  user_id    INTEGER      NOT NULL,
  data       TEXT         DEFAULT NULL,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);

CREATE TABLE IF NOT EXISTS user_follows (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL,
  escort_id  INTEGER   NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_user_follows UNIQUE (user_id, escort_id)
);

CREATE TABLE IF NOT EXISTS profile_claims (
  id         SERIAL PRIMARY KEY,
  escort_id  INTEGER      NOT NULL,
  user_id    INTEGER      NOT NULL,
  message    TEXT         DEFAULT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_profile_claims_escort_id ON profile_claims (escort_id);
CREATE INDEX IF NOT EXISTS idx_profile_claims_user_id   ON profile_claims (user_id);

CREATE TABLE IF NOT EXISTS claims (
  id         SERIAL PRIMARY KEY,
  escort_id  INTEGER      NOT NULL,
  user_id    INTEGER      NOT NULL,
  message    TEXT         DEFAULT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL,
  escort_id  INTEGER      DEFAULT NULL,
  plan       VARCHAR(50)  NOT NULL DEFAULT 'standard',
  amount     INTEGER      NOT NULL DEFAULT 0,
  phone      VARCHAR(30)  DEFAULT NULL,
  tx_ref     VARCHAR(100) DEFAULT NULL,
  status     VARCHAR(20)  NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMP    DEFAULT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id   ON subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_escort_id ON subscriptions (escort_id);
