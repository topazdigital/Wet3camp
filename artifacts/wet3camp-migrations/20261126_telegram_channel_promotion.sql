-- Store escort consent and delivery state for approved Telegram channel posts.
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `telegram_promo_opt_in` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `telegram_promo_status` varchar(16) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS `telegram_promo_message_id` bigint(20) UNSIGNED DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `telegram_promo_sent_at` datetime DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `telegram_promo_error` varchar(500) DEFAULT NULL;
