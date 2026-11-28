-- Persist member chat and short-lived Lounge presence.
-- This migration is safe to re-run and does not modify existing rows.
CREATE TABLE IF NOT EXISTS `lounge_messages` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `category`   VARCHAR(20)  NOT NULL DEFAULT 'general',
  `body`       VARCHAR(800) NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_lounge_messages_created` (`created_at`, `id`),
  KEY `idx_lounge_messages_category_created` (`category`, `created_at`, `id`),
  KEY `idx_lounge_messages_user_created` (`user_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lounge_presence` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    INT UNSIGNED NOT NULL,
  `last_seen`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lounge_presence_user` (`user_id`),
  KEY `idx_lounge_presence_last_seen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
