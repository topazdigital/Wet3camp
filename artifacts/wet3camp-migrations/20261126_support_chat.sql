-- Separate, additive tables for public support conversations and admin replies.
CREATE TABLE IF NOT EXISTS `support_conversations` (
  `id`                    int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`               int(10) UNSIGNED DEFAULT NULL,
  `guest_name`            varchar(120)     DEFAULT NULL,
  `guest_email`           varchar(254)     DEFAULT NULL,
  `guest_token_hash`      char(64)         DEFAULT NULL,
  `category`              varchar(40)      NOT NULL DEFAULT 'general',
  `status`                varchar(20)      NOT NULL DEFAULT 'open',
  `admin_unread_count`    int(10) UNSIGNED NOT NULL DEFAULT 0,
  `customer_unread_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `last_message_at`       datetime         NOT NULL DEFAULT current_timestamp(),
  `created_at`            datetime         NOT NULL DEFAULT current_timestamp(),
  `updated_at`            datetime         NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_support_conversations_user_status` (`user_id`, `status`, `last_message_at`),
  KEY `idx_support_conversations_status_last` (`status`, `last_message_at`),
  KEY `idx_support_conversations_guest_hash` (`guest_token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `support_messages` (
  `id`               int(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `conversation_id`  int(10) UNSIGNED NOT NULL,
  `sender_type`      varchar(12)      NOT NULL,
  `sender_user_id`   int(10) UNSIGNED DEFAULT NULL,
  `content`          text             NOT NULL,
  `read_at`          datetime         DEFAULT NULL,
  `created_at`       datetime         NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_support_messages_conversation_created` (`conversation_id`, `created_at`),
  KEY `idx_support_messages_unread` (`conversation_id`, `sender_type`, `read_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
