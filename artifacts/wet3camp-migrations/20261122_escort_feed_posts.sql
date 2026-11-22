-- Create storage for escort-authored feed posts and their interactions.
-- Re-running this migration is safe; existing data is left untouched.
CREATE TABLE IF NOT EXISTS `feed_posts` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `escort_id`  INT UNSIGNED NOT NULL,
  `user_id`    INT UNSIGNED NOT NULL,
  `body`       TEXT         NOT NULL,
  `media_json` LONGTEXT     NOT NULL,
  `is_active`  TINYINT(1)   NOT NULL DEFAULT 1,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_feed_posts_escort_created` (`escort_id`, `created_at`),
  KEY `idx_feed_posts_user_id` (`user_id`),
  KEY `idx_feed_posts_active_created` (`is_active`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `feed_post_likes` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`    INT UNSIGNED NOT NULL,
  `guest_key`  VARCHAR(64)  NOT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feed_post_likes_guest` (`post_id`, `guest_key`),
  KEY `idx_feed_post_likes_post_id` (`post_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `feed_post_comments` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`     INT UNSIGNED NOT NULL,
  `parent_id`   INT UNSIGNED DEFAULT NULL,
  `author_name` VARCHAR(100) NOT NULL DEFAULT 'Anonymous',
  `body`        TEXT         NOT NULL,
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_feed_post_comments_post_id` (`post_id`),
  KEY `idx_feed_post_comments_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `feed_post_reports` (
  `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `post_id`     INT UNSIGNED NOT NULL,
  `reporter_id` INT UNSIGNED NOT NULL,
  `reason`      VARCHAR(100) NOT NULL,
  `details`     TEXT         DEFAULT NULL,
  `status`      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_feed_post_reporter` (`post_id`, `reporter_id`),
  KEY `idx_feed_post_reports_status` (`status`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
