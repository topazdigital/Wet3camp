CREATE TABLE IF NOT EXISTS `user_follows` (
  `id`         int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`    int(10) UNSIGNED NOT NULL,
  `escort_id`  int(10) UNSIGNED NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_follows_user_escort` (`user_id`, `escort_id`),
  KEY `idx_user_follows_user_id` (`user_id`),
  KEY `idx_user_follows_escort_id` (`escort_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `user_follows` (`user_id`, `escort_id`, `created_at`)
SELECT `user_id`, `escort_id`, `created_at` FROM `followers`;
