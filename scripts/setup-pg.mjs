/**
 * PostgreSQL schema initialisation — Replit dev environment only.
 * Run: node scripts/setup-pg.mjs
 * MySQL remains the ONLY production database for wet3.camp.
 */
import pg from 'pg'
const { Pool } = pg

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const DDL = `
-- platform_settings
CREATE TABLE IF NOT EXISTS platform_settings (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(100) NOT NULL UNIQUE,
  value       TEXT         NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- users
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL DEFAULT '',
  role          VARCHAR(20)  NOT NULL DEFAULT 'user',
  display_name  VARCHAR(100),
  avatar        VARCHAR(500),
  phone         VARCHAR(20),
  is_active     SMALLINT     NOT NULL DEFAULT 1,
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- sessions
CREATE TABLE IF NOT EXISTS sessions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL,
  token      VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- escorts
CREATE TABLE IF NOT EXISTS escorts (
  id               SERIAL PRIMARY KEY,
  user_id          INTEGER,
  name             VARCHAR(100) NOT NULL,
  age              SMALLINT     NOT NULL DEFAULT 18,
  city             VARCHAR(80),
  area             VARCHAR(100),
  lat              NUMERIC(10,6),
  lng              NUMERIC(10,6),
  tier             VARCHAR(20)  NOT NULL DEFAULT 'standard',
  rating           NUMERIC(3,1) NOT NULL DEFAULT 0.0,
  reviews_count    INTEGER      NOT NULL DEFAULT 0,
  bio              TEXT,
  height           VARCHAR(10),
  body_type        VARCHAR(50),
  ethnicity        VARCHAR(50),
  hair_color       VARCHAR(50),
  gender           VARCHAR(20)  NOT NULL DEFAULT 'Female',
  price_hourly     INTEGER      NOT NULL DEFAULT 0,
  price_overnight  INTEGER      NOT NULL DEFAULT 0,
  price_video      INTEGER      NOT NULL DEFAULT 0,
  price_incall     INTEGER      NOT NULL DEFAULT 0,
  price_outcall    INTEGER      NOT NULL DEFAULT 0,
  whatsapp         VARCHAR(20),
  telegram         VARCHAR(80),
  featured         SMALLINT     NOT NULL DEFAULT 0,
  featured_expires TIMESTAMP,
  available        SMALLINT     NOT NULL DEFAULT 1,
  verified         SMALLINT     NOT NULL DEFAULT 0,
  is_active        SMALLINT     NOT NULL DEFAULT 0,
  online           SMALLINT     NOT NULL DEFAULT 0,
  images           TEXT,
  profile_image    VARCHAR(500),
  created_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_escorts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- escort_gallery
CREATE TABLE IF NOT EXISTS escort_gallery (
  id         SERIAL PRIMARY KEY,
  escort_id  INTEGER      NOT NULL,
  url        VARCHAR(500) NOT NULL,
  caption    VARCHAR(200),
  position   INTEGER      NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_gallery_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE
);

-- escort_services
CREATE TABLE IF NOT EXISTS escort_services (
  id        SERIAL PRIMARY KEY,
  escort_id INTEGER     NOT NULL,
  name      VARCHAR(100) NOT NULL,
  available SMALLINT    NOT NULL DEFAULT 1,
  CONSTRAINT fk_services_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  UNIQUE (escort_id, name)
);

-- escort_languages
CREATE TABLE IF NOT EXISTS escort_languages (
  id        SERIAL PRIMARY KEY,
  escort_id INTEGER     NOT NULL,
  language  VARCHAR(50) NOT NULL,
  CONSTRAINT fk_languages_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  UNIQUE (escort_id, language)
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id          BIGSERIAL PRIMARY KEY,
  escort_id   INTEGER   NOT NULL,
  client_id   INTEGER,
  from_escort SMALLINT  NOT NULL DEFAULT 0,
  content     TEXT      NOT NULL,
  read_at     TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_msg_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  CONSTRAINT fk_msg_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL
);

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER,
  escort_id  INTEGER     NOT NULL,
  date       DATE        NOT NULL,
  time       VARCHAR(10) NOT NULL,
  duration   SMALLINT    NOT NULL DEFAULT 1,
  type       VARCHAR(30) NOT NULL DEFAULT 'Outcall',
  location   VARCHAR(200),
  amount     INTEGER     NOT NULL DEFAULT 0,
  status     VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes      TEXT,
  created_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_bookings_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_bookings_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE
);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  escort_id   INTEGER  NOT NULL,
  client_id   INTEGER,
  rating      SMALLINT NOT NULL DEFAULT 5,
  title       VARCHAR(200),
  body        TEXT,
  is_verified SMALLINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_reviews_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE,
  CONSTRAINT fk_reviews_client FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE SET NULL
);

-- favorites
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL,
  escort_id  INTEGER   NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, escort_id),
  CONSTRAINT fk_favs_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_favs_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE
);

-- followers
CREATE TABLE IF NOT EXISTS followers (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER   NOT NULL,
  escort_id  INTEGER   NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, escort_id),
  CONSTRAINT fk_followers_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_followers_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE CASCADE
);

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id         BIGSERIAL PRIMARY KEY,
  user_id    INTEGER      NOT NULL,
  type       VARCHAR(50)  NOT NULL,
  title      VARCHAR(200) NOT NULL,
  body       TEXT,
  link       VARCHAR(300),
  is_read    SMALLINT     NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_notifs_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- password_resets
CREATE TABLE IF NOT EXISTS password_resets (
  id         SERIAL PRIMARY KEY,
  email      VARCHAR(255) NOT NULL,
  token      VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP    NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- adverts
CREATE TABLE IF NOT EXISTS adverts (
  id          SERIAL PRIMARY KEY,
  escort_id   INTEGER,
  title       VARCHAR(200) NOT NULL,
  description TEXT,
  image       VARCHAR(500),
  link        VARCHAR(500),
  position    VARCHAR(20)  NOT NULL DEFAULT 'banner',
  is_active   SMALLINT     NOT NULL DEFAULT 1,
  starts_at   TIMESTAMP,
  ends_at     TIMESTAMP,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_adverts_escort FOREIGN KEY (escort_id) REFERENCES escorts(id) ON DELETE SET NULL
);

-- blacklist
CREATE TABLE IF NOT EXISTS blacklist (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  phone       VARCHAR(20),
  reason      TEXT         NOT NULL,
  reported_by INTEGER,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_blacklist_user FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL
);

-- rooms (for hotel/room bookings if used)
CREATE TABLE IF NOT EXISTS rooms (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  price       INTEGER      NOT NULL DEFAULT 0,
  is_active   SMALLINT     NOT NULL DEFAULT 1,
  created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);
`

const SEED_ESCORTS = `
INSERT INTO escorts
  (id,name,age,city,area,lat,lng,tier,rating,reviews_count,bio,height,body_type,ethnicity,hair_color,price_hourly,price_overnight,price_video,whatsapp,telegram,available,verified,is_active,online)
VALUES
  (1,'Amara K.',25,'Nairobi','Westlands',-1.2635,36.8037,'elite',4.9,243,'Westlands elite companion — cosmopolitan, discreet, and captivating. Nairobi''s finest.','5''7"','Slim/Athletic','Kikuyu','Black',8500,55000,3500,'254712345001','amarak_wet3camp',1,1,1,1),
  (2,'Zara M.',23,'Nairobi','Kilimani',-1.2903,36.7852,'vip',4.8,187,'Kilimani VIP escort with Somali heritage. Petite, warm, and endlessly charming.','5''4"','Petite/Slim','Somali-Kenyan','Black',6000,38000,2500,'254712345002','zaram_wet3camp',1,1,1,1),
  (3,'Luna K.',27,'Nairobi','Lavington',-1.2760,36.7769,'vip',4.7,145,'Lavington companion — elegant, educated, and effortlessly sophisticated.','5''6"','Slim/Curvy','Mixed-Kenyan','Dark Brown',5500,35000,2200,'254712345003','lunak_wet3camp',1,1,0,0),
  (4,'Priya S.',26,'Nairobi','Upper Hill',-1.2972,36.8185,'premium',4.6,98,'Upper Hill premium companion of South-Asian-Kenyan heritage. Articulate, warm, and strikingly beautiful.','5''5"','Slim/Toned','South Asian','Black',4000,26000,1600,'254712345004','priyas_wet3camp',1,1,1,0),
  (5,'Fatuma H.',24,'Nairobi','Parklands',-1.2591,36.8184,'premium',4.5,82,'Parklands beauty with Swahili roots. Bilingual English/Swahili, bubbly personality.','5''4"','Curvy','Swahili','Black',3500,22000,1400,'254712345005','fatumah_wet3camp',1,1,0,0),
  (6,'Aisha N.',22,'Nairobi','Runda',-1.2122,36.8140,'elite',4.9,312,'Runda estate elite — top-tier discretion for the most demanding clients. Cosmopolitan, multilingual, unforgettable.','5''8"','Slim/Tall','Somali-Kenyan','Black',12000,75000,4500,'254712345006','aishan_wet3camp',1,1,1,1),
  (7,'Mercy W.',28,'Nairobi','Hurlingham',-1.2980,36.7920,'premium',4.5,76,'Hurlingham premium escort. Kikuyu beauty with a warm smile and a kind heart. Excellent reviews.','5''5"','Average/Curvy','Kikuyu','Natural',3800,24000,1500,'254712345007','mercyw_wet3camp',1,0,1,0),
  (8,'Cynthia O.',25,'Nairobi','South B',-1.3126,36.8249,'vip',4.7,121,'South B VIP companion. Luo heritage, bold personality, and an infectious laugh.','5''6"','Athletic','Luo','Black',5800,37000,2300,'254712345008','cynthiao_wet3camp',1,1,1,1),
  (9,'Wanjiku M.',24,'Nairobi','Lang''ata',-1.3567,36.7435,'standard',4.3,45,'Lang''ata companion — approachable, genuine, and great value. Local favourite.','5''3"','Average','Kikuyu','Black',2000,12000,800,'254712345009','wanjikum_wet3camp',1,0,1,0),
  (10,'Leilah A.',29,'Nairobi','Karen',-1.3217,36.7130,'elite',4.9,267,'Karen estate elite companion. Educated, well-travelled, and exclusively available to discerning clients.','5''7"','Slim/Athletic','Luhya','Relaxed/Dark',10500,65000,4200,'254712345010','leilaha_wet3camp',0,1,1,1),
  (11,'Grace N.',23,'Nairobi','Embakasi',-1.3207,36.8972,'standard',4.2,37,'Embakasi neighbourhood beauty. Fun, down-to-earth and always available.','5''4"','Curvy','Kikuyu','Black',1800,11000,700,'254712345011','gracen_wet3camp',1,0,1,0),
  (12,'Halima O.',26,'Nairobi','Eastleigh',-1.2742,36.8449,'standard',4.4,53,'Eastleigh companion. Somali-Kenyan beauty with a warm personality and competitive rates.','5''5"','Slim','Somali-Kenyan','Black',2200,14000,900,'254712345012','halimao_wet3camp',1,0,0,0),
  (13,'Sharon K.',25,'Nairobi','Donholm',-1.2916,36.8783,'standard',4.1,28,'Donholm area escort. Young, friendly, and making great first impressions.','5''3"','Average','Kikuyu','Black',1800,11000,700,'254712345013','sharonk_wet3camp',1,0,1,0),
  (14,'Beatrice A.',28,'Nairobi','Ruaka',-1.2038,36.7654,'standard',4.3,41,'Ruaka area companion. Luo background, outgoing and easy to talk to.','5''4"','Average','Luo','Black',2000,12500,800,'254712345014','beatricea_wet3camp',1,0,1,0),
  (15,'Nia C.',24,'Mombasa','Nyali',-4.0351,39.7226,'vip',4.8,156,'Nyali VIP escort. Mixed-Kenyan beauty who grew up on the Mombasa coast.','5''6"','Slim/Athletic','Mixed-Kenyan','Natural',5500,35000,2200,'254712345015','niac_wet3camp',1,1,1,1),
  (16,'Zawadi S.',27,'Mombasa','Bamburi',-3.9904,39.7276,'vip',4.7,134,'Bamburi coastal companion. Arabic-Swahili heritage and timeless elegance.','5''5"','Slim/Curvy','Arab-Swahili','Black',5200,33000,2100,'254712345016','zawadis_wet3camp',1,1,0,0),
  (17,'Amina H.',23,'Mombasa','Mombasa CBD',-4.0620,39.6659,'premium',4.5,67,'Old Town Mombasa companion. Swahili culture runs deep — genuine coastal hospitality.','5''4"','Petite/Slim','Swahili','Black',3200,21000,1300,'254712345017','aminah_wet3camp',1,1,1,0),
  (18,'Rahel T.',25,'Mombasa','Diani Beach',-4.3160,39.5692,'elite',4.9,201,'Diani Beach elite escort. Ethiopian-Kenyan beauty at the most beautiful beach in Kenya.','5''7"','Slim/Athletic','Ethiopian-Kenyan','Black',9000,58000,3500,'254712345018','rahelt_wet3camp',1,1,1,1),
  (19,'Miriam K.',29,'Nairobi','Gigiri',-1.2290,36.8015,'elite',4.8,229,'Gigiri diplomatic zone elite companion. Fluent in 4 languages, impeccable presentation.','5''7"','Slim','Kikuyu','Relaxed/Dark',10000,62000,4000,'254712345019','miramiak_wet3camp',1,1,1,1),
  (20,'Esther O.',22,'Kisumu','Milimani',-0.0960,34.7720,'premium',4.5,59,'Kisumu Milimani premium escort. Luo beauty with lakeside warmth and natural charm.','5''5"','Curvy','Luo','Black',3000,19000,1200,'254712345020','hestherko_wet3camp',1,1,1,0),
  (21,'Akinyi J.',26,'Kisumu','Kisumu CBD',-0.1022,34.7617,'premium',4.6,74,'Kisumu CBD companion. Luo through and through — bold, beautiful, and unforgettable.','5''6"','Athletic/Slim','Luo','Natural',3500,22500,1400,'254712345021','akinyij_wet3camp',1,1,0,0),
  (22,'Moraa N.',24,'Kisumu','Mamboleo',-0.0808,34.8215,'standard',4.2,31,'Mamboleo area companion. Kisii heritage, bright smile, and always on time.','5''3"','Average','Kisii','Black',1800,11000,700,'254712345022','moraan_wet3camp',1,0,1,0),
  (23,'Tabitha C.',27,'Nakuru','Nakuru CBD',-0.3030,36.0800,'premium',4.6,81,'Nakuru CBD premium companion. Kikuyu beauty with extensive knowledge of the Rift Valley.','5''5"','Slim/Toned','Kikuyu','Black',3500,22000,1400,'254712345023','tabithac_wet3camp',1,1,1,0),
  (24,'Violah M.',25,'Nakuru','Milimani',-0.2882,36.0610,'vip',4.7,98,'Nakuru Milimani VIP escort. University-educated, refined, and discreet.','5''6"','Slim','Kikuyu','Dark Brown',5000,32000,2000,'254712345024','violahm_wet3camp',1,1,1,1),
  (25,'Chebet J.',23,'Eldoret','Eldoret CBD',0.5143,35.2698,'standard',4.4,29,'Eldoret companion. Kalenjin athlete with a stunning figure and warm personality.','5''5"','Athletic/Slim','Kalenjin','Black',2000,12500,800,'254712345025','chebetj_wet3camp',1,0,1,0),
  (26,'Njeri W.',24,'Nairobi','Kileleshwa',-1.2770,36.7784,'elite',4.9,167,'Kileleshwa-based elite companion. Kikuyu beauty with a sharp intellect.','5''6"','Slim/Toned','Kikuyu','Black',9500,58000,3800,'254712345026','njeriw_wet3camp',1,1,1,1),
  (27,'Chepkoech A.',23,'Nairobi','Spring Valley',-1.2607,36.7620,'vip',4.8,139,'Spring Valley VIP escort. Kalenjin beauty with cosmopolitan outlook.','5''7"','Athletic','Kalenjin','Natural',6800,42000,2600,'254712345027','chepkoeha_wet3camp',1,1,0,0),
  (28,'Awino P.',26,'Nairobi','Muthaiga',-1.2450,36.8230,'elite',4.9,219,'Muthaiga elite — discreet, cultured, and utterly enchanting Luo companion.','5''8"','Slim','Luo','Black',11000,68000,4200,'254712345028','awinop_wet3camp',1,1,1,1),
  (29,'Wambui K.',28,'Nairobi','Gigiri',-1.2290,36.8015,'vip',4.7,112,'UN Village area VIP escort. Fluent in 4 languages, passionate about travel.','5''6"','Slim/Athletic','Kikuyu','Dark Brown',7500,46000,3000,'254712345029','wambuik_wet3camp',0,1,0,0),
  (30,'Hafsa M.',25,'Nairobi','South C',-1.3120,36.8290,'premium',4.6,94,'South C premium companion with Somali-Kenyan heritage. Petite and stunning.','5''3"','Petite/Slim','Somali-Kenyan','Black',4200,27000,1700,'254712345030','hafasm_wet3camp',1,1,1,1),
  (31,'Nyambura G.',27,'Nairobi','Loresho',-1.2562,36.7520,'premium',4.5,81,'Loresho companion. Confident, independent, and always the best-dressed.','5''5"','Curvy','Kikuyu','Black',4000,26000,1600,'254712345031','nyamburag_wet3camp',1,0,1,0),
  (32,'Baraka L.',22,'Nairobi','Rosslyn',-1.2191,36.7857,'vip',4.7,107,'Rosslyn VIP companion — radiant, educated beauty in Nairobi''s leafy suburbs.','5''7"','Slim/Tall','Mixed-Kenyan','Natural',7000,44000,2800,'254712345032','barakal_wet3camp',1,1,1,1),
  (33,'Cherotich B.',24,'Nairobi','Kyuna',-1.2534,36.7683,'premium',4.6,88,'Kyuna companion with Kalenjin roots. Sporty, energetic, and full of life.','5''6"','Athletic/Toned','Kalenjin','Black',4500,29000,1900,'254712345033','cherotichb_wet3camp',1,1,1,0),
  (34,'Wangari N.',29,'Nairobi','Ridgeways',-1.2342,36.8420,'elite',4.8,198,'Ridgeways elite escort. Mature, elegant, and deeply experienced.','5''7"','Slim/Curvy','Kikuyu','Relaxed/Dark',10000,62000,4000,'254712345034','wangarin_wet3camp',1,1,1,1),
  (35,'Mukami S.',23,'Nairobi','Brookside',-1.2614,36.8010,'standard',4.4,58,'Brookside neighbourhood beauty — approachable, genuine, always available.','5''4"','Average','Kikuyu','Black',2000,12500,850,'254712345035','mukamis_wet3camp',1,0,1,0),
  (36,'Nafula A.',25,'Mombasa','Nyali',-4.0051,39.7094,'elite',4.9,189,'Nyali elite — Luhya beauty with sophisticated coastal lifestyle.','5''6"','Slim','Luhya','Black',9000,56000,3500,'254712345036','nafula_wet3camp',1,1,1,1),
  (37,'Amina K.',22,'Mombasa','Shanzu',-3.9620,39.7210,'premium',4.6,72,'Shanzu beach companion. Swahili beauty raised on the northern coast.','5''5"','Slim/Toned','Swahili','Black',3800,24000,1500,'254712345037','aminak_wet3camp',1,1,1,1),
  (38,'Fatuma Y.',26,'Mombasa','Tudor',-4.0560,39.6808,'standard',4.3,49,'Tudor area companion offering authentic coastal experiences.','5''4"','Average','Swahili','Black',1900,11500,750,'254712345038','fatumay_wet3camp',1,0,1,0),
  (39,'Zawadi M.',28,'Mombasa','Kizingo',-4.0663,39.6681,'vip',4.8,142,'Old Town Kizingo VIP escort. Arabic-Swahili heritage, fluent Arabic and English.','5''6"','Slim','Arab-Swahili','Black',6500,41000,2600,'254712345039','zawadim_wet3camp',0,1,1,0),
  (40,'Mariamu B.',24,'Mombasa','Likoni',-4.0925,39.6626,'standard',4.2,36,'Likoni beauty. Genuine, caring, and always available.','5''3"','Curvy','Swahili','Black',1800,11000,700,'254712345040','mariamub_wet3camp',1,0,1,0),
  (41,'Atieno R.',23,'Kisumu','Milimani',-0.0960,34.7720,'vip',4.7,118,'Kisumu VIP companion. Luo beauty who studied abroad with international flair.','5''6"','Slim/Athletic','Luo','Natural',5000,32000,2000,'254712345041','atienor_wet3camp',1,1,1,1),
  (42,'Auma C.',27,'Kisumu','Kisumu West',-0.1145,34.7404,'premium',4.5,63,'Kisumu West premium companion. Genuine lakeside warmth.','5''5"','Curvy','Luo','Black',3000,19000,1200,'254712345042','aumac_wet3camp',1,1,1,0),
  (43,'Adhiambo S.',25,'Kisumu','Kondele',-0.0902,34.7853,'standard',4.3,41,'Kondele companion. Outgoing and full of energy.','5''4"','Average','Luo','Black',1700,10500,700,'254712345043','adhiambos_wet3camp',1,0,1,0),
  (44,'Chebet K.',24,'Nakuru','Nakuru CBD',-0.3030,36.0800,'premium',4.6,78,'Nakuru CBD premium companion. Kalenjin heritage, warm smile.','5''5"','Slim/Toned','Kalenjin','Black',3500,22000,1400,'254712345044','chebet_wet3camp',1,1,1,1),
  (45,'Nyambura T.',26,'Nakuru','Lanet',-0.2679,36.0946,'standard',4.3,33,'Lanet area companion. Young, friendly and easy-going.','5''3"','Average','Kikuyu','Black',1700,10000,650,'254712345045','nyamburate_wet3camp',1,0,1,0),
  (46,'Purity M.',23,'Nakuru','Milimani Nakuru',-0.2882,36.0610,'vip',4.7,95,'Nakuru Milimani VIP escort. University graduate, refined and discreet.','5''6"','Slim','Kikuyu','Dark Brown',5000,31000,2000,'254712345046','puritym_wet3camp',1,1,1,1),
  (47,'Lagat C.',25,'Eldoret','Langas',0.5043,35.2690,'premium',4.5,55,'Langas, Eldoret premium companion. Kalenjin athlete with stunning figure.','5''7"','Athletic/Slim','Kalenjin','Black',3200,20000,1300,'254712345047','lagatc_wet3camp',1,1,1,0),
  (48,'Cherop N.',22,'Eldoret','Eldoret CBD',0.5143,35.2698,'standard',4.4,29,'Eldoret CBD companion. Fresh on the platform, earning rave reviews.','5''5"','Average','Kalenjin','Black',1900,11000,750,'254712345048','chero_wet3camp',1,0,1,0),
  (49,'Nashipai L.',27,'Nairobi','Ngong',-1.3649,36.6580,'premium',4.6,82,'Ngong Hills companion with Maasai heritage. Tall, striking, unforgettable.','5''9"','Slim/Tall','Maasai','Black',4200,27000,1700,'254712345049','nashipail_wet3camp',1,1,1,1),
  (50,'Kavata M.',24,'Nairobi','Machakos Town',-1.5167,37.2667,'standard',4.3,45,'Machakos-based companion. Kamba beauty with a bubbly personality.','5''4"','Average','Kamba','Black',2000,12000,800,'254712345050','kavatam_wet3camp',1,0,1,0)
ON CONFLICT (id) DO NOTHING;
`

const SEED_SERVICES = `
INSERT INTO escort_services (escort_id, name, available) VALUES
(1,'Dinner Dates',1),(1,'Video Calls',1),(1,'Overnight',1),(1,'Out-Call',1),(1,'Travel Companion',1),(1,'Events & Functions',1),
(2,'Dinner Dates',1),(2,'Video Calls',1),(2,'Overnight',1),(2,'Out-Call',1),(2,'Travel Companion',1),(2,'Events & Functions',1),
(3,'Dinner Dates',1),(3,'Video Calls',1),(3,'Overnight',1),(3,'Out-Call',1),(3,'Travel Companion',1),(3,'Events & Functions',1),
(4,'Dinner Dates',1),(4,'Video Calls',1),(4,'Overnight',1),(4,'Out-Call',1),
(5,'Dinner Dates',1),(5,'Video Calls',1),(5,'Overnight',1),(5,'Out-Call',1),(5,'Travel Companion',1),
(6,'Dinner Dates',1),(6,'Video Calls',1),(6,'Overnight',1),(6,'Out-Call',1),(6,'Travel Companion',1),(6,'Events & Functions',1),
(7,'Dinner Dates',1),(7,'Video Calls',1),(7,'Overnight',1),(7,'Out-Call',1),
(8,'Dinner Dates',1),(8,'Video Calls',1),(8,'Overnight',1),(8,'Out-Call',1),(8,'Travel Companion',1),(8,'Events & Functions',1),
(9,'Dinner Dates',1),(9,'Video Calls',1),(9,'Overnight',1),(9,'Out-Call',1),
(10,'Dinner Dates',1),(10,'Video Calls',1),(10,'Overnight',1),(10,'Out-Call',1),(10,'Travel Companion',1),(10,'Events & Functions',1),
(11,'Dinner Dates',1),(11,'Video Calls',1),(11,'Overnight',1),(11,'Out-Call',1),
(12,'Dinner Dates',1),(12,'Video Calls',1),(12,'Overnight',1),(12,'Out-Call',1),
(13,'Dinner Dates',1),(13,'Video Calls',1),(13,'Out-Call',1),
(14,'Dinner Dates',1),(14,'Video Calls',1),(14,'Overnight',1),(14,'Out-Call',1),
(15,'Dinner Dates',1),(15,'Video Calls',1),(15,'Overnight',1),(15,'Out-Call',1),(15,'Travel Companion',1),(15,'Events & Functions',1),
(16,'Dinner Dates',1),(16,'Video Calls',1),(16,'Overnight',1),(16,'Out-Call',1),(16,'Travel Companion',1),(16,'Events & Functions',1),
(17,'Dinner Dates',1),(17,'Video Calls',1),(17,'Overnight',1),(17,'Out-Call',1),
(18,'Dinner Dates',1),(18,'Video Calls',1),(18,'Overnight',1),(18,'Out-Call',1),(18,'Travel Companion',1),(18,'Events & Functions',1),
(19,'Dinner Dates',1),(19,'Video Calls',1),(19,'Overnight',1),(19,'Out-Call',1),(19,'Travel Companion',1),(19,'Events & Functions',1),
(20,'Dinner Dates',1),(20,'Video Calls',1),(20,'Overnight',1),(20,'Out-Call',1),
(21,'Dinner Dates',1),(21,'Video Calls',1),(21,'Overnight',1),(21,'Out-Call',1),
(22,'Dinner Dates',1),(22,'Video Calls',1),(22,'Out-Call',1),
(23,'Dinner Dates',1),(23,'Video Calls',1),(23,'Overnight',1),(23,'Out-Call',1),
(24,'Dinner Dates',1),(24,'Video Calls',1),(24,'Overnight',1),(24,'Out-Call',1),(24,'Travel Companion',1),
(25,'Dinner Dates',1),(25,'Video Calls',1),(25,'Out-Call',1),
(26,'Dinner Dates',1),(26,'Video Calls',1),(26,'Overnight',1),(26,'Out-Call',1),(26,'Travel Companion',1),
(27,'Dinner Dates',1),(27,'Video Calls',1),(27,'Overnight',1),(27,'Out-Call',1),(27,'Travel Companion',1),
(28,'Dinner Dates',1),(28,'Video Calls',1),(28,'Overnight',1),(28,'Out-Call',1),(28,'Travel Companion',1),(28,'Events & Functions',1),
(29,'Dinner Dates',1),(29,'Video Calls',1),(29,'Overnight',1),(29,'Out-Call',1),(29,'Travel Companion',1),
(30,'Dinner Dates',1),(30,'Video Calls',1),(30,'Overnight',1),(30,'Out-Call',1),
(31,'Dinner Dates',1),(31,'Video Calls',1),(31,'Overnight',1),(31,'Out-Call',1),
(32,'Dinner Dates',1),(32,'Video Calls',1),(32,'Overnight',1),(32,'Out-Call',1),(32,'Travel Companion',1),
(33,'Dinner Dates',1),(33,'Video Calls',1),(33,'Overnight',1),(33,'Out-Call',1),
(34,'Dinner Dates',1),(34,'Video Calls',1),(34,'Overnight',1),(34,'Out-Call',1),(34,'Travel Companion',1),(34,'Events & Functions',1),
(35,'Dinner Dates',1),(35,'Video Calls',1),(35,'Overnight',1),(35,'Out-Call',1),
(36,'Dinner Dates',1),(36,'Video Calls',1),(36,'Overnight',1),(36,'Out-Call',1),(36,'Travel Companion',1),(36,'Events & Functions',1),
(37,'Dinner Dates',1),(37,'Video Calls',1),(37,'Overnight',1),(37,'Out-Call',1),(37,'Travel Companion',1),
(38,'Dinner Dates',1),(38,'Video Calls',1),(38,'Out-Call',1),
(39,'Dinner Dates',1),(39,'Video Calls',1),(39,'Overnight',1),(39,'Out-Call',1),(39,'Travel Companion',1),
(40,'Dinner Dates',1),(40,'Video Calls',1),(40,'Out-Call',1),
(41,'Dinner Dates',1),(41,'Video Calls',1),(41,'Overnight',1),(41,'Out-Call',1),(41,'Travel Companion',1),
(42,'Dinner Dates',1),(42,'Video Calls',1),(42,'Overnight',1),(42,'Out-Call',1),
(43,'Dinner Dates',1),(43,'Video Calls',1),(43,'Out-Call',1),
(44,'Dinner Dates',1),(44,'Video Calls',1),(44,'Overnight',1),(44,'Out-Call',1),(44,'Travel Companion',1),
(45,'Dinner Dates',1),(45,'Video Calls',1),(45,'Out-Call',1),
(46,'Dinner Dates',1),(46,'Video Calls',1),(46,'Overnight',1),(46,'Out-Call',1),(46,'Travel Companion',1),
(47,'Dinner Dates',1),(47,'Video Calls',1),(47,'Overnight',1),(47,'Out-Call',1),(47,'Travel Companion',1),
(48,'Dinner Dates',1),(48,'Video Calls',1),(48,'Out-Call',1),
(49,'Dinner Dates',1),(49,'Video Calls',1),(49,'Overnight',1),(49,'Out-Call',1),(49,'Travel Companion',1),
(50,'Dinner Dates',1),(50,'Video Calls',1),(50,'Out-Call',1)
ON CONFLICT (escort_id, name) DO NOTHING;
`

const SEED_LANGUAGES = `
INSERT INTO escort_languages (escort_id, language) VALUES
(1,'English'),(1,'Swahili'),
(2,'English'),(2,'Swahili'),(2,'French'),
(3,'English'),(3,'Swahili'),
(4,'English'),(4,'Swahili'),(4,'Hindi'),
(5,'English'),(5,'Swahili'),
(6,'English'),(6,'Swahili'),(6,'Arabic'),
(7,'English'),(7,'Swahili'),
(8,'English'),(8,'Swahili'),(8,'Luo'),
(9,'English'),(9,'Swahili'),
(10,'English'),(10,'Swahili'),(10,'French'),
(11,'English'),(11,'Swahili'),
(12,'English'),(12,'Swahili'),(12,'Somali'),
(13,'English'),(13,'Swahili'),
(14,'English'),(14,'Swahili'),(14,'Luo'),
(15,'English'),(15,'Swahili'),
(16,'English'),(16,'Swahili'),(16,'Arabic'),
(17,'English'),(17,'Swahili'),
(18,'English'),(18,'Swahili'),(18,'Amharic'),
(19,'English'),(19,'Swahili'),(19,'French'),(19,'Italian'),
(20,'English'),(20,'Swahili'),(20,'Luo'),
(21,'English'),(21,'Swahili'),(21,'Luo'),
(22,'English'),(22,'Swahili'),(22,'Kisii'),
(23,'English'),(23,'Swahili'),(23,'Kikuyu'),
(24,'English'),(24,'Swahili'),
(25,'English'),(25,'Swahili'),(25,'Kalenjin'),
(26,'English'),(26,'Swahili'),(26,'Kikuyu'),
(27,'English'),(27,'Swahili'),(27,'Kalenjin'),
(28,'English'),(28,'Swahili'),(28,'Luo'),(28,'French'),
(29,'English'),(29,'Swahili'),(29,'Kikuyu'),
(30,'English'),(30,'Swahili'),(30,'Somali'),
(31,'English'),(31,'Swahili'),(31,'Kikuyu'),
(32,'English'),(32,'Swahili'),(32,'French'),
(33,'English'),(33,'Swahili'),(33,'Kalenjin'),
(34,'English'),(34,'Swahili'),(34,'Kikuyu'),(34,'French'),
(35,'English'),(35,'Swahili'),(35,'Kikuyu'),
(36,'English'),(36,'Swahili'),(36,'Luhya'),
(37,'English'),(37,'Swahili'),
(38,'English'),(38,'Swahili'),
(39,'English'),(39,'Swahili'),(39,'Arabic'),
(40,'English'),(40,'Swahili'),
(41,'English'),(41,'Swahili'),(41,'Luo'),
(42,'English'),(42,'Swahili'),(42,'Luo'),
(43,'English'),(43,'Swahili'),(43,'Luo'),
(44,'English'),(44,'Swahili'),(44,'Kalenjin'),
(45,'English'),(45,'Swahili'),(45,'Kikuyu'),
(46,'English'),(46,'Swahili'),
(47,'English'),(47,'Swahili'),(47,'Kalenjin'),
(48,'English'),(48,'Swahili'),(48,'Kalenjin'),
(49,'English'),(49,'Swahili'),(49,'Maasai'),
(50,'English'),(50,'Swahili'),(50,'Kamba')
ON CONFLICT (escort_id, language) DO NOTHING;
`

const SEED_SETTINGS = `
INSERT INTO platform_settings (key, value) VALUES
  ('platform_name',      'Wet3 Camp'),
  ('tagline',            'Kenya''s #1 Premium Companion Platform'),
  ('support_email',      'support@wet3camp.com'),
  ('min_rate',           '1500'),
  ('commission_pct',     '10'),
  ('tier_elite_monthly', '8500'),
  ('tier_vip_monthly',   '4500'),
  ('tier_premium_monthly','2200'),
  ('tier_standard_monthly','0'),
  ('featured_3day',      '500'),
  ('featured_weekly',    '1500'),
  ('featured_monthly',   '4500'),
  ('sub_monthly',        '500'),
  ('sub_quarterly',      '1200'),
  ('sub_annual',         '4000'),
  ('require_approval',   '0')
ON CONFLICT (key) DO NOTHING;
`

const RESET_SEQS = `
SELECT setval('escorts_id_seq',  (SELECT COALESCE(MAX(id), 50) FROM escorts));
SELECT setval('users_id_seq',    (SELECT COALESCE(MAX(id),  1) FROM users));
SELECT setval('sessions_id_seq', 1, false);
`

async function run() {
  console.log('[setup-pg] Connecting…')
  const client = await pool.connect()
  try {
    console.log('[setup-pg] Creating tables…')
    await client.query(DDL)
    console.log('[setup-pg] Seeding escorts…')
    await client.query(SEED_ESCORTS)
    console.log('[setup-pg] Seeding services…')
    await client.query(SEED_SERVICES)
    console.log('[setup-pg] Seeding languages…')
    await client.query(SEED_LANGUAGES)
    console.log('[setup-pg] Seeding platform settings…')
    await client.query(SEED_SETTINGS)
    console.log('[setup-pg] Resetting sequences…')
    await client.query(RESET_SEQS)
    console.log('[setup-pg] Done! 50 escorts + platform settings seeded.')
  } finally {
    client.release()
    await pool.end()
  }
}

run().catch(err => { console.error('[setup-pg] FAILED:', err.message); process.exit(1) })
