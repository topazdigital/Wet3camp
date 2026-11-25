-- Save the chosen verification method and keep claim videos private in MySQL.
ALTER TABLE profile_claims
  ADD COLUMN IF NOT EXISTS `verification_method` varchar(20) NOT NULL DEFAULT 'manual';
ALTER TABLE profile_claims
  ADD COLUMN IF NOT EXISTS `verification_video_data` mediumblob DEFAULT NULL;
ALTER TABLE profile_claims
  ADD COLUMN IF NOT EXISTS `verification_video_mime` varchar(80) DEFAULT NULL;
