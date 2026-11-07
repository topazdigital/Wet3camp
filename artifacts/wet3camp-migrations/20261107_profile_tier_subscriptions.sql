-- Store the provider transaction reference for server-side payment verification
-- and the paid profile tier expiry. Existing manually assigned tiers stay intact.
ALTER TABLE escorts
  ADD COLUMN IF NOT EXISTS `tier_expires_at` datetime DEFAULT NULL;

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS `provider_ref` varchar(100) DEFAULT NULL;
