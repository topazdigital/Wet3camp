-- Migration 001: Referral / Affiliate system
-- Applied automatically on startup via migrate.ts (MySQL/production only)
-- For dev PostgreSQL, see scripts/init-pg-dev.sql

CREATE TABLE IF NOT EXISTS `schema_migrations` (
  `id`         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `filename`   VARCHAR(200) NOT NULL,
  `applied_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_schema_migrations_filename` (`filename`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `referrals` (
  `id`               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`          INT UNSIGNED NOT NULL,
  `code`             VARCHAR(20)  NOT NULL,
  `referred_user_id` INT UNSIGNED DEFAULT NULL,
  `type`             VARCHAR(20)  NOT NULL DEFAULT 'registration',
  `reward_kes`       INT UNSIGNED NOT NULL DEFAULT 500,
  `status`           VARCHAR(20)  NOT NULL DEFAULT 'pending',
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `converted_at`     DATETIME     DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_referral_code` (`code`),
  KEY `idx_referrals_user_id` (`user_id`),
  KEY `idx_referrals_referred_user_id` (`referred_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
