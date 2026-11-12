-- Support reviewed duplicate-profile claims on existing production databases.
-- The source listing remains archived through escorts.merged_into_id after a
-- merge, while profile_claims keeps the review and selected canonical target.
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `merged_into_id` int(10) unsigned DEFAULT NULL;

CREATE TABLE IF NOT EXISTS `profile_claims` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `escort_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `merge_into_escort_id` int(10) unsigned DEFAULT NULL,
  `message` text DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_profile_claims_escort_id` (`escort_id`),
  KEY `idx_profile_claims_user_id` (`user_id`),
  KEY `idx_profile_claims_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE profile_claims
  ADD COLUMN IF NOT EXISTS `merge_into_escort_id` int(10) unsigned DEFAULT NULL;
