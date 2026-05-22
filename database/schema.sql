-- Wet3 Camp Database Schema
-- Kenyan Booking Platform

-- Users Table (Base for all user types)
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  user_type ENUM('escort', 'client', 'advertiser', 'admin') NOT NULL,
  full_name VARCHAR(255),
  display_name VARCHAR(255),
  bio TEXT,
  profile_image VARCHAR(255),
  location VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Kenya',
  country_code VARCHAR(5) DEFAULT '+254',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  is_banned BOOLEAN DEFAULT FALSE,
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  login_method ENUM('email', 'phone', 'username') NOT NULL,
  INDEX idx_user_type (user_type),
  INDEX idx_city (city),
  INDEX idx_email_verified (email_verified),
  INDEX idx_created_at (created_at)
);

-- Email Verification Tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires_at (expires_at)
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Escorts Table
CREATE TABLE IF NOT EXISTS escorts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  rate_per_hour INT NOT NULL COMMENT 'KES currency',
  rate_overnight INT NOT NULL COMMENT 'KES currency',
  video_call_rate INT NOT NULL COMMENT 'KES currency',
  age INT,
  height VARCHAR(10),
  weight VARCHAR(10),
  ethnicity VARCHAR(100),
  body_type VARCHAR(50),
  hair_color VARCHAR(50),
  eye_color VARCHAR(50),
  languages JSON,
  services JSON,
  availability_status ENUM('available', 'busy', 'offline') DEFAULT 'available',
  tier ENUM('free', 'standard', 'premium', 'vip', 'elite') DEFAULT 'free',
  is_verified BOOLEAN DEFAULT FALSE,
  featured BOOLEAN DEFAULT FALSE,
  featured_until TIMESTAMP NULL,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0,
  review_count INT DEFAULT 0,
  last_online TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_tier (tier),
  INDEX idx_featured (featured),
  INDEX idx_city (user_id),
  INDEX idx_rating (rating),
  INDEX idx_availability (availability_status)
);

-- Escort Gallery
CREATE TABLE IF NOT EXISTS escort_gallery (
  id INT PRIMARY KEY AUTO_INCREMENT,
  escort_id INT NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  order INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  INDEX idx_escort_id (escort_id)
);

-- Clients Table
CREATE TABLE IF NOT EXISTS clients (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  verification_status ENUM('unverified', 'verified') DEFAULT 'unverified',
  total_bookings INT DEFAULT 0,
  total_spent INT DEFAULT 0 COMMENT 'KES currency',
  average_rating DECIMAL(3, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_created_at (created_at)
);

-- Advertisers Table
CREATE TABLE IF NOT EXISTS advertisers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT UNIQUE NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100),
  tax_id VARCHAR(50),
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  subscription_tier ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
  subscription_expires_at TIMESTAMP NULL,
  total_campaigns INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_business_type (business_type)
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  escort_id INT NOT NULL,
  client_id INT NOT NULL,
  booking_date DATETIME NOT NULL,
  duration_hours INT,
  location VARCHAR(255),
  total_amount INT NOT NULL COMMENT 'KES currency',
  status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_booking_date (booking_date),
  INDEX idx_escort_id (escort_id)
);

-- Reviews & Ratings
CREATE TABLE IF NOT EXISTS reviews (
  id INT PRIMARY KEY AUTO_INCREMENT,
  booking_id INT NOT NULL,
  escort_id INT NOT NULL,
  client_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_escort_id (escort_id),
  INDEX idx_rating (rating)
);

-- Favorites/Wishlist
CREATE TABLE IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  client_id INT NOT NULL,
  escort_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_favorite (client_id, escort_id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id)
);

-- Admin Logs
CREATE TABLE IF NOT EXISTS admin_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_id INT NOT NULL,
  action VARCHAR(255) NOT NULL,
  target_user_id INT,
  details TEXT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value LONGTEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES 
('platform_name', 'Wet3 Camp'),
('currency', 'KES'),
('currency_symbol', 'KES'),
('site_email', 'support@wet3.camp'),
('verification_email_expiry_hours', '24'),
('platform_commission_percentage', '15');
