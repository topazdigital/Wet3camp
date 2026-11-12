-- Store provider identities independently from account email addresses.
-- Re-running this migration is safe.
CREATE TABLE IF NOT EXISTS `user_auth_providers` (
  `id`                 int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`            int(10) UNSIGNED NOT NULL,
  `provider`           varchar(32)      NOT NULL,
  `provider_user_id`   varchar(191)     NOT NULL,
  `provider_username`  varchar(191)     DEFAULT NULL,
  `created_at`         datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_auth_provider_identity` (`provider`, `provider_user_id`),
  UNIQUE KEY `uq_auth_provider_user` (`user_id`, `provider`),
  KEY `idx_auth_provider_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
