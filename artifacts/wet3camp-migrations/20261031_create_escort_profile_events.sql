-- Additive, idempotent migration for private escort profile analytics.
-- Safe to apply before each deploy; it does not modify existing profile data.
CREATE TABLE IF NOT EXISTS `escort_profile_events` (
  `id`            bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `escort_id`     int(10) unsigned NOT NULL,
  `event_type`    varchar(32) NOT NULL,
  `visitor_hash`  char(64) NOT NULL,
  `source`        varchar(24) NOT NULL DEFAULT 'direct',
  `city_context`  varchar(80) DEFAULT NULL,
  `created_at`    datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_profile_events_escort_created` (`escort_id`, `created_at`),
  KEY `idx_profile_events_escort_type_created` (`escort_id`, `event_type`, `created_at`),
  KEY `idx_profile_events_escort_visitor_created` (`escort_id`, `visitor_hash`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
