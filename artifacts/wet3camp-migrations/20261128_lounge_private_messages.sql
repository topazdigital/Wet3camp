-- Store private, participant-only messages started from public Lounge posts.
-- This migration is safe to re-run and does not modify existing rows.
CREATE TABLE IF NOT EXISTS `lounge_conversations` (
  `id`             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `member_one_id`  INT UNSIGNED NOT NULL,
  `member_two_id`  INT UNSIGNED NOT NULL,
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lounge_conversations_pair` (`member_one_id`, `member_two_id`),
  KEY `idx_lounge_conversations_one_updated` (`member_one_id`, `updated_at`),
  KEY `idx_lounge_conversations_two_updated` (`member_two_id`, `updated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `lounge_direct_messages` (
  `id`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id` INT UNSIGNED NOT NULL,
  `sender_id`       INT UNSIGNED NOT NULL,
  `body`            VARCHAR(800) NOT NULL,
  `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read_at`         DATETIME     NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_lounge_direct_messages_conversation` (`conversation_id`, `id`),
  KEY `idx_lounge_direct_messages_sender_created` (`sender_id`, `created_at`),
  KEY `idx_lounge_direct_messages_unread` (`conversation_id`, `sender_id`, `read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
