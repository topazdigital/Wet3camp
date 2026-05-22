-- Comprehensive Database Schema for Wet3Camp Escort Booking Platform
-- Production-ready with all necessary tables, indexes, and relationships

-- ============================================================================
-- USERS TABLE (Clients, Escorts, Admins)
-- ============================================================================
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255),
  display_name VARCHAR(100) NOT NULL,
  profile_photo_url TEXT,
  role ENUM('client', 'escort', 'advertiser', 'admin') NOT NULL DEFAULT 'client',
  
  -- Verification & Security
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  email_verified BOOLEAN DEFAULT FALSE,
  email_verified_at TIMESTAMP,
  phone_verified BOOLEAN DEFAULT FALSE,
  phone_verified_at TIMESTAMP,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  
  -- Profile Status
  bio TEXT,
  status ENUM('active', 'inactive', 'suspended', 'banned', 'pending_approval') DEFAULT 'pending_approval',
  
  -- Social Logins
  google_id VARCHAR(255),
  facebook_id VARCHAR(255),
  apple_id VARCHAR(255),
  linkedin_id VARCHAR(255),
  
  -- Metadata
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  total_reviews INT DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status),
  INDEX idx_verified (verified),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- ESCORTS TABLE (Specific escort details)
-- ============================================================================
CREATE TABLE escorts (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL UNIQUE,
  
  -- Personal Details
  age INT,
  body_type ENUM('slim', 'athletic', 'curvy', 'plus_size', 'other'),
  ethnicity VARCHAR(50),
  hair_color VARCHAR(50),
  height_cm INT,
  
  -- Languages (JSON array)
  languages JSON DEFAULT '[]',
  
  -- Availability & Hours
  availability_json JSON, -- {"mon": {"start": "18:00", "end": "23:00", "available": true}}
  
  -- Services Offered (JSON)
  services JSON DEFAULT '[]', -- [{"name": "video_call", "available": true}]
  
  -- Pricing
  incall_rate DECIMAL(10,2),
  outcall_rate DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  overnight_rate DECIMAL(10,2),
  video_call_rate DECIMAL(10,2),
  
  -- Media
  video_url TEXT, -- Verification video
  
  -- Verification Levels
  verification_level ENUM('unverified', 'email_verified', 'id_verified', 'video_verified', 'premium_verified') DEFAULT 'unverified',
  id_verification_photo_url TEXT,
  approval_photo_url TEXT,
  id_verification_at TIMESTAMP,
  
  -- Health Certificate
  health_certificate_url TEXT,
  health_certificate_expires TIMESTAMP,
  
  -- Stats
  views_count INT DEFAULT 0,
  booking_count INT DEFAULT 0,
  response_time_minutes INT, -- Average response time
  
  -- Badges & Status
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT TRUE,
  featured_until TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_verification_level (verification_level),
  INDEX idx_featured (is_featured),
  INDEX idx_hourly_rate (hourly_rate)
);

-- ============================================================================
-- ESCORT_PHOTOS TABLE
-- ============================================================================
CREATE TABLE escort_photos (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  escort_id VARCHAR(36) NOT NULL,
  photo_url TEXT NOT NULL,
  display_order INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  INDEX idx_escort_id (escort_id),
  INDEX idx_display_order (display_order)
);

-- ============================================================================
-- BOOKINGS TABLE
-- ============================================================================
CREATE TABLE bookings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  client_id VARCHAR(36) NOT NULL,
  escort_id VARCHAR(36) NOT NULL,
  
  -- Booking Details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INT,
  service_type ENUM('incall', 'outcall', 'video_call', 'travel') NOT NULL,
  
  -- Location
  location VARCHAR(255),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  
  -- Payment
  amount DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2),
  deposit_paid BOOLEAN DEFAULT FALSE,
  payment_status ENUM('pending', 'deposit_paid', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  payment_method ENUM('card', 'mPesa', 'paypal', 'bank_transfer', 'wallet') DEFAULT 'card',
  payment_id VARCHAR(255),
  
  -- Status
  status ENUM('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') DEFAULT 'pending',
  cancellation_reason TEXT,
  cancelled_by ENUM('client', 'escort', 'system'),
  cancelled_at TIMESTAMP,
  
  -- Messaging
  client_note TEXT,
  escort_note TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_escort_id (escort_id),
  INDEX idx_booking_date (booking_date),
  INDEX idx_status (status),
  INDEX idx_payment_status (payment_status)
);

-- ============================================================================
-- PAYMENTS TABLE
-- ============================================================================
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  booking_id VARCHAR(36),
  user_id VARCHAR(36) NOT NULL,
  
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'KES',
  payment_method ENUM('card', 'mPesa', 'paypal', 'bank_transfer', 'wallet') NOT NULL,
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  
  -- Payment Gateway Reference
  transaction_id VARCHAR(255) UNIQUE,
  gateway_response JSON,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id)
);

-- ============================================================================
-- REVIEWS TABLE
-- ============================================================================
CREATE TABLE reviews (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  booking_id VARCHAR(36) NOT NULL,
  client_id VARCHAR(36) NOT NULL,
  escort_id VARCHAR(36) NOT NULL,
  
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  
  -- Review Details
  is_verified_booking BOOLEAN DEFAULT TRUE,
  is_recommended BOOLEAN DEFAULT TRUE,
  
  -- Photos
  photo_urls JSON DEFAULT '[]',
  
  -- Response from Escort
  escort_response TEXT,
  escort_response_at TIMESTAMP,
  
  -- Moderation
  is_approved BOOLEAN DEFAULT TRUE,
  is_flagged BOOLEAN DEFAULT FALSE,
  flag_reason VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  INDEX idx_escort_id (escort_id),
  INDEX idx_rating (rating),
  INDEX idx_approved (is_approved),
  UNIQUE KEY unique_booking_review (booking_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE messages (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  sender_id VARCHAR(36) NOT NULL,
  receiver_id VARCHAR(36) NOT NULL,
  
  message_text TEXT NOT NULL,
  
  -- Media
  attachment_url TEXT,
  attachment_type ENUM('image', 'document', 'video'),
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  is_deleted_by_sender BOOLEAN DEFAULT FALSE,
  is_deleted_by_receiver BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_id (sender_id),
  INDEX idx_receiver_id (receiver_id),
  INDEX idx_created_at (created_at),
  INDEX idx_is_read (is_read)
);

-- ============================================================================
-- FAVORITES TABLE
-- ============================================================================
CREATE TABLE favorites (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  user_id VARCHAR(36) NOT NULL,
  escort_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  UNIQUE KEY unique_favorite (user_id, escort_id),
  INDEX idx_user_id (user_id)
);

-- ============================================================================
-- FOLLOWS TABLE
-- ============================================================================
CREATE TABLE follows (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  follower_id VARCHAR(36) NOT NULL,
  following_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_follow (follower_id, following_id),
  INDEX idx_follower_id (follower_id),
  INDEX idx_following_id (following_id)
);

-- ============================================================================
-- REPORTS TABLE (Spam, Scam, Inappropriate Content)
-- ============================================================================
CREATE TABLE reports (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  reporter_id VARCHAR(36) NOT NULL,
  reported_user_id VARCHAR(36),
  reported_escort_id VARCHAR(36),
  
  report_type ENUM('spam', 'scam', 'inappropriate_content', 'harassment', 'fake_profile', 'other') NOT NULL,
  reason TEXT NOT NULL,
  evidence_urls JSON DEFAULT '[]',
  
  -- Moderation
  status ENUM('pending', 'investigating', 'resolved', 'dismissed') DEFAULT 'pending',
  admin_response TEXT,
  admin_id VARCHAR(36),
  action_taken ENUM('no_action', 'warning', 'suspended', 'banned') DEFAULT 'no_action',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (reported_escort_id) REFERENCES escorts(id) ON DELETE SET NULL,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- ============================================================================
-- BLOCKS TABLE (User blocking functionality)
-- ============================================================================
CREATE TABLE blocks (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  blocker_id VARCHAR(36) NOT NULL,
  blocked_id VARCHAR(36) NOT NULL,
  reason VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_block (blocker_id, blocked_id),
  INDEX idx_blocker_id (blocker_id)
);

-- ============================================================================
-- ADMIN_SETTINGS TABLE
-- ============================================================================
CREATE TABLE admin_settings (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  data_type ENUM('string', 'integer', 'decimal', 'boolean', 'json') DEFAULT 'string',
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_setting_key (setting_key)
);

-- ============================================================================
-- Default Admin Settings
-- ============================================================================
INSERT INTO admin_settings (setting_key, setting_value, data_type, description) VALUES
('platform_commission_rate', '10', 'decimal', 'Commission percentage for platform'),
('payment_gateway_fee', '2.5', 'decimal', 'Payment gateway fee percentage'),
('minimum_withdrawal', '500', 'decimal', 'Minimum amount for withdrawal'),
('deposit_percentage', '50', 'integer', 'Deposit percentage for bookings'),
('auto_approval_escortprofile', 'false', 'boolean', 'Auto-approve escort profiles'),
('email_notifications_enabled', 'true', 'boolean', 'Enable email notifications'),
('sms_notifications_enabled', 'true', 'boolean', 'Enable SMS notifications'),
('payment_methods_enabled', '["card", "mPesa", "paypal"]', 'json', 'Enabled payment methods');

-- ============================================================================
-- AUDIT_LOG TABLE
-- ============================================================================
CREATE TABLE audit_logs (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  admin_id VARCHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(36),
  changes JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_created_at (created_at),
  INDEX idx_admin_id (admin_id)
);

-- ============================================================================
-- SEO_METADATA TABLE (For SEO optimization)
-- ============================================================================
CREATE TABLE seo_metadata (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
  page_type ENUM('home', 'escort_profile', 'search_results', 'blog', 'static') NOT NULL,
  page_id VARCHAR(36),
  
  meta_title VARCHAR(70),
  meta_description VARCHAR(160),
  meta_keywords TEXT,
  og_title VARCHAR(100),
  og_description VARCHAR(160),
  og_image_url TEXT,
  
  canonical_url VARCHAR(255),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================================
-- Create Indexes for Performance
-- ============================================================================
CREATE INDEX idx_bookings_client_escort ON bookings(client_id, escort_id);
CREATE INDEX idx_bookings_date_range ON bookings(booking_date, start_time);
CREATE INDEX idx_reviews_escort_rating ON reviews(escort_id, rating);
CREATE INDEX idx_messages_conversation ON messages(sender_id, receiver_id, created_at);
CREATE INDEX idx_escorts_rating_views ON escorts(average_rating DESC, views_count DESC);
