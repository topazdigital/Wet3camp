-- =============================================================
-- Wet3 Camp — MySQL Seed Data (Sample / Demo)
-- Run AFTER schema.sql
-- =============================================================

USE wet3camp;

-- ----------------------------------------------------------------
-- USERS
-- ----------------------------------------------------------------
INSERT INTO users (username, email, password_hash, role, is_verified, is_active) VALUES
  ('admin',     'admin@wet3camp.co.ke',    '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'admin',    1, 1),
  ('amara_k',   'amara@wet3camp.co.ke',    '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'escort',   1, 1),
  ('zara_m',    'zara@wet3camp.co.ke',     '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'escort',   1, 1),
  ('luna_k',    'luna@wet3camp.co.ke',     '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'escort',   1, 1),
  ('sophia_n',  'sophia@wet3camp.co.ke',   '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'escort',   1, 1),
  ('client_john', 'john@example.com',      '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'client',   1, 1),
  ('client_mike', 'mike@example.com',      '$2b$12$REPLACE_WITH_HASHED_PASSWORD', 'client',   1, 1);

-- ----------------------------------------------------------------
-- PROFILES
-- ----------------------------------------------------------------
INSERT INTO profiles (user_id, display_name, age, location, city, bio, badge_level, price_per_hour, is_available, is_featured, is_verified, primary_image, rating_avg, rating_count) VALUES
  (2, 'Amara K.',  24, 'Nairobi CBD, Nairobi',  'Nairobi', 'Elite companion — sophisticated, educated & discreet.',    'elite',   8000, 1, 1, 1, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500', 4.90, 156),
  (3, 'Zara M.',   22, 'Westlands, Nairobi',     'Nairobi', 'VIP companion — fun-loving and adventurous.',              'vip',     6500, 1, 1, 1, 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500', 4.80, 142),
  (4, 'Luna K.',   25, 'Karen, Nairobi',          'Nairobi', 'Premium escort — classy and professional.',                'vip',     5000, 0, 0, 1, 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=500', 4.70, 128),
  (5, 'Sophia N.', 23, 'Kilimani, Nairobi',       'Nairobi', 'Premium companion — charming & reliable.',                 'premium', 4000, 1, 0, 1, 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500', 4.60, 115);

-- ----------------------------------------------------------------
-- PROFILE SERVICES
-- ----------------------------------------------------------------
INSERT INTO profile_services (profile_id, service) VALUES
  (1, 'Dinner Dates'), (1, 'Overnight'), (1, 'Travel Companion'), (1, 'Video Calls'),
  (2, 'Dinner Dates'), (2, 'Events'),    (2, 'Travel Companion'),
  (3, 'Massage'),      (3, 'Overnight'), (3, 'Video Calls'),
  (4, 'Dinner Dates'), (4, 'Events');

-- ----------------------------------------------------------------
-- EVENTS
-- ----------------------------------------------------------------
INSERT INTO events (title, description, category, event_date, location, city, price, capacity, attendees_count) VALUES
  ('VIP Gala Night',       'Exclusive high-end gathering for verified clients.',       'Exclusive', '2026-06-07 20:00:00', 'Westlands, Nairobi',    'Nairobi', 5000,  50,  48),
  ('Mombasa Beach Party',  'Sunset beach party with premium escort companions.',       'Social',    '2026-06-08 16:00:00', 'Nyali, Mombasa',        'Mombasa', 2500, 200, 120),
  ('Elite Private Mixer',  'Small intimate gathering — invite-only.',                  'Exclusive', '2026-06-13 19:00:00', 'Karen, Nairobi',         'Nairobi', 8000,  30,  24),
  ('Rooftop Sundowner',    'Relaxed rooftop drinks with companions.',                  'Social',    '2026-06-14 17:00:00', 'CBD, Nairobi',           'Nairobi', 1500, 100,  85),
  ('Luxury Spa Day',       'Full day spa & relaxation package with a companion.',      'Wellness',  '2026-06-15 10:00:00', 'Lavington, Nairobi',    'Nairobi', 4000,  20,  16);

-- ----------------------------------------------------------------
-- ROOMS
-- ----------------------------------------------------------------
INSERT INTO rooms (name, description, location, city, price_per_night, capacity, amenities, is_available, rating_avg, rating_count) VALUES
  ('The Red Suite',       'Luxurious private suite with jacuzzi.',         'Westlands, Nairobi',  'Nairobi', 12000, 2, '["AC","WiFi","Bar","Jacuzzi","TV"]',   1, 4.9, 45),
  ('Executive Penthouse', 'Top-floor penthouse with panoramic city views.','Upperhill, Nairobi',  'Nairobi', 25000, 2, '["AC","WiFi","Kitchen","View","Bar"]', 1, 4.8, 32),
  ('Cozy Studio',         'Intimate studio apartment in quiet area.',      'Kilimani, Nairobi',   'Nairobi',  6500, 2, '["AC","WiFi","Parking"]',              0, 4.6, 28),
  ('Beachfront Villa',    'Private villa steps from the beach.',           'Nyali, Mombasa',      'Mombasa', 35000, 4, '["AC","Pool","Bar","Beach","Kitchen"]', 1, 5.0, 17);

-- ----------------------------------------------------------------
-- SHOP PRODUCTS
-- ----------------------------------------------------------------
INSERT INTO shop_products (name, description, category, price, stock, image_url, is_active, rating_avg) VALUES
  ('Luxury Collection Set', 'Premium adult collection — discreetly packaged.',    'Premium', 8500,  50, 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=300', 1, 4.8),
  ('Beginners Bundle',      'Perfect starter kit — everything you need.',         'Starter', 3200, 120, 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=300', 1, 4.6),
  ('Professional Grade',    'High-performance professional equipment.',           'Premium',12000,  20, 'https://images.unsplash.com/photo-1551431009-381d36ac3a4b?w=300', 1, 4.9),
  ('Discreet Travel Kit',   'Compact travel-friendly kit — TSA compliant.',       'Travel',  4500,  80, 'https://images.unsplash.com/photo-1551028719-00167b16ebc5?w=300', 1, 4.7),
  ('Couples Bundle',        'Everything for two — unforgettable experiences.',    'Premium',15000,  15, 'https://images.unsplash.com/photo-1576091160550-112173faf00e?w=300', 1, 4.8),
  ('Solo Pleasure Pro',     'Top-rated solo experience kit.',                     'Popular', 6800,  60, 'https://images.unsplash.com/photo-1549887534-f2cb8a4e6d1a?w=300', 1, 4.9);

-- ----------------------------------------------------------------
-- TESTIMONIALS
-- ----------------------------------------------------------------
INSERT INTO testimonials (author_name, author_role, content, rating, is_approved) VALUES
  ('James M.',  'Regular Client',  'Wet3 Camp completely changed how I find quality companionship. Discreet and verified.', 5, 1),
  ('Peter K.',  'VIP Member',      'Best platform in Kenya. The elite escorts are truly top-tier professionals.',            5, 1),
  ('Samuel O.', 'Verified Client', 'Seamless booking process. Ladies are exactly as advertised. No surprises.',             5, 1),
  ('Mark N.',   'Premium Member',  'Fast bookings, real profiles, outstanding service every time.',                          4, 1),
  ('Daniel W.', 'Regular Client',  'Discreet, professional and reliable. The team knows what clients want.',                 5, 1);

-- ----------------------------------------------------------------
-- BLACKLIST
-- ----------------------------------------------------------------
INSERT INTO blacklist (reported_user, reason, reports_count, is_confirmed) VALUES
  ('Anonymous User #4821', 'Non-payment after service',          3, 1),
  ('Anonymous User #2293', 'Harassment and abusive behavior',    7, 1),
  ('Anonymous User #6610', 'Fake identity / impersonation',      2, 1),
  ('Anonymous User #3374', 'No-show on confirmed bookings',      5, 1),
  ('Anonymous User #9985', 'Scam attempts on escorts',           8, 1);

-- ----------------------------------------------------------------
-- ADMIN ROLES
-- ----------------------------------------------------------------
INSERT INTO admin_roles (user_id, role, permissions) VALUES
  (1, 'super_admin', '{"all": true}');
