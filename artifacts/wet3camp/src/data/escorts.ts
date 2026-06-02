export interface Service { name: string; available: boolean }
export interface ReviewData { id: number; client: string; rating: number; text: string; date: string }
export interface Escort {
  id: string; name: string; age: number; city: string; area: string
  lat: number; lng: number; tier: 'elite'|'vip'|'premium'|'standard'|'free'
  rating: number; reviews: number; image: string; gallery: string[]
  bio: string; services: Service[]
  pricing: { hourly: number; overnight: number; video: number; incall?: number; outcall?: number; incallOvernight?: number; outcallOvernight?: number }
  languages: string[]; height: string; bodyType: string
  ethnicity: string; hairColor: string
  available: boolean; verified: boolean; online: boolean; phone?: string
  reviews_data?: ReviewData[]
  whatsapp?: string; telegram?: string
}

const U = (id: string, w = 600, h = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&h=${h}&fit=crop&crop=face`

export function getSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// African/Kenyan women photos — replace with real uploads once DB is live
const PHOTOS = [
  'photo-1531123897727-8f129e1688ce', // African woman, warm smile
  'photo-1522529599102-193c0d76b5b6', // Black woman, striking look
  'photo-1509868918748-a554bf5f7e09', // African woman, elegant
  'photo-1531123414780-f74242c2b052', // Black woman, natural hair
  'photo-1583195764036-798f1052af7e', // African woman, fashionable
  'photo-1488716820095-cbe80883c496', // Black woman, confident
  'photo-1562571157-a3d69eba929d',    // African woman, glamorous
  'photo-1580489944761-15a19d654956', // Kenyan-look woman
  'photo-1517960413843-0aee8e2b3285', // Beautiful African woman
  'photo-1557053910-d9eadeed1c58',    // Black woman, close-up
  'photo-1552374196-c4e7ffc6e126',    // African woman, classic
  'photo-1534751516642-a1af1ef26a56', // Black woman, stylish
]

const gallery = (main: string) => [
  U(main, 200, 250),
  ...PHOTOS.filter(p => p !== main).slice(0, 5).map(p => U(p, 200, 250)),
]

const STD_SERVICES: Service[] = [
  { name: 'Dinner Dates',       available: true  },
  { name: 'Video Calls',        available: true  },
  { name: 'Overnight',          available: true  },
  { name: 'Out-Call',           available: true  },
  { name: 'Travel Companion',   available: false },
  { name: 'Events & Functions', available: false },
]
const VIP_SERVICES: Service[] = [
  { name: 'Dinner Dates',       available: true },
  { name: 'Video Calls',        available: true },
  { name: 'Overnight',          available: true },
  { name: 'Out-Call',           available: true },
  { name: 'Travel Companion',   available: true },
  { name: 'Events & Functions', available: true },
  { name: 'Hotel Visits',       available: true },
]

const SAMPLE_REVIEWS_1: ReviewData[] = [
  { id: 1, client: 'John K.',   rating: 5, text: 'Absolutely stunning and incredibly professional. Made me feel completely at ease from the start. Worth every shilling — will definitely book again.', date: '2 days ago' },
  { id: 2, client: 'David M.',  rating: 5, text: 'Best experience I\'ve had on this platform. Punctual, elegant and a fantastic conversationalist. The dinner date exceeded all expectations.', date: '1 week ago' },
  { id: 3, client: 'Paul O.',   rating: 5, text: 'Highly recommend. Very discreet and professional. Exactly as advertised — beautiful, intelligent and warm-hearted.', date: '2 weeks ago' },
  { id: 4, client: 'James T.',  rating: 4, text: 'Great experience overall. Very attentive and well-presented. A true professional. Slight delay but well worth it.', date: '1 month ago' },
]
const SAMPLE_REVIEWS_2: ReviewData[] = [
  { id: 5, client: 'Mike A.',   rating: 5, text: 'Exceptional escort for my business trip to Nairobi. Spoke perfect French and knew the city well. 10/10.', date: '3 days ago' },
  { id: 6, client: 'Brian K.',  rating: 5, text: 'Zara is everything her profile promises and more. Sophisticated, fun and incredibly beautiful. A premium experience.', date: '3 weeks ago' },
  { id: 7, client: 'Eric N.',   rating: 4, text: 'Very professional and easy to talk to. Made the evening very enjoyable. Would recommend to anyone visiting Westlands.', date: '1 month ago' },
]

export const ESCORTS: Escort[] = [
  {
    id: '1', name: 'Amara K.', age: 24, city: 'Nairobi', area: 'Nairobi CBD',
    lat: -1.2921, lng: 36.8219, tier: 'elite', rating: 4.9, reviews: 156,
    image: U(PHOTOS[0]), gallery: gallery(PHOTOS[0]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: VIP_SERVICES, pricing: { hourly: 8000, overnight: 50000, video: 3000 },
    languages: ['English', 'Swahili'], height: "5'6\"", bodyType: 'Slim/Athletic',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: true,
    reviews_data: SAMPLE_REVIEWS_1,
  },
  {
    id: '2', name: 'Zara M.', age: 26, city: 'Nairobi', area: 'Westlands',
    lat: -1.2679, lng: 36.8082, tier: 'vip', rating: 4.8, reviews: 142,
    image: U(PHOTOS[1]), gallery: gallery(PHOTOS[1]),
    bio: 'VIP escort in Westlands. Fluent in 3 languages, world-traveller, and passionate about providing a premium, discreet service. Whether it\'s a dinner, event, or private meeting — I deliver perfection.',
    services: VIP_SERVICES, pricing: { hourly: 6500, overnight: 40000, video: 2500 },
    languages: ['English', 'Swahili', 'French'], height: "5'7\"", bodyType: 'Athletic',
    ethnicity: 'Kenyan', hairColor: 'Natural', available: true, verified: true, online: true,
    reviews_data: SAMPLE_REVIEWS_2,
  },
  {
    id: '3', name: 'Luna K.', age: 23, city: 'Nairobi', area: 'Karen',
    lat: -1.3176, lng: 36.7063, tier: 'vip', rating: 4.7, reviews: 128,
    image: U(PHOTOS[2]), gallery: gallery(PHOTOS[2]),
    bio: 'Karen-based VIP escort. Known for my intelligence, elegance and impeccable style. I cater exclusively to discerning gentlemen who appreciate quality above all.',
    services: VIP_SERVICES, pricing: { hourly: 5000, overnight: 35000, video: 2000 },
    languages: ['English', 'Swahili'], height: "5'5\"", bodyType: 'Slim',
    ethnicity: 'Kenyan', hairColor: 'Dark Brown', available: false, verified: true, online: false,
  },
  {
    id: '4', name: 'Sophia N.', age: 27, city: 'Nairobi', area: 'Kilimani',
    lat: -1.2903, lng: 36.7855, tier: 'premium', rating: 4.6, reviews: 115,
    image: U(PHOTOS[3]), gallery: gallery(PHOTOS[3]),
    bio: 'Premium Kilimani escort with a warm personality and stunning looks. I love connecting with real people and creating genuine, special memories. Discretion guaranteed.',
    services: STD_SERVICES, pricing: { hourly: 4000, overnight: 25000, video: 1500 },
    languages: ['English', 'Swahili', 'Kikuyu'], height: "5'4\"", bodyType: 'Curvy',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: true,
  },
  {
    id: '5', name: 'Priya S.', age: 25, city: 'Nairobi', area: 'Lavington',
    lat: -1.2820, lng: 36.7726, tier: 'premium', rating: 4.8, reviews: 189,
    image: U(PHOTOS[4]), gallery: gallery(PHOTOS[4]),
    bio: 'Half-Kenyan, half-Indian beauty residing in Lavington. Exotic, educated, and always well-presented. My company is a rare blend of culture, beauty and intellectual conversation.',
    services: VIP_SERVICES, pricing: { hourly: 5500, overnight: 38000, video: 2200 },
    languages: ['English', 'Hindi', 'Swahili'], height: "5'5\"", bodyType: 'Slim/Toned',
    ethnicity: 'Mixed', hairColor: 'Black', available: true, verified: true, online: false,
  },
  {
    id: '6', name: 'Fatuma H.', age: 22, city: 'Nairobi', area: 'Parklands',
    lat: -1.2575, lng: 36.8205, tier: 'elite', rating: 4.9, reviews: 203,
    image: U(PHOTOS[5]), gallery: gallery(PHOTOS[5]),
    bio: 'Top-rated elite escort in Parklands. Coastal beauty who moved to Nairobi for a vibrant lifestyle. Warm, funny, and irresistibly charming — an experience you won\'t forget.',
    services: VIP_SERVICES, pricing: { hourly: 9000, overnight: 55000, video: 3500 },
    languages: ['English', 'Swahili', 'Arabic'], height: "5'6\"", bodyType: 'Slim',
    ethnicity: 'Swahili', hairColor: 'Black', available: true, verified: true, online: true,
  },
  {
    id: '7', name: 'Grace W.', age: 28, city: 'Nairobi', area: 'Upperhill',
    lat: -1.3000, lng: 36.8192, tier: 'premium', rating: 4.5, reviews: 97,
    image: U(PHOTOS[6]), gallery: gallery(PHOTOS[6]),
    bio: "Professional escort based in Upperhill, Nairobi's business district. Corporate-friendly, always punctual and impeccably dressed. Ideal for business dinners and high-profile events.",
    services: STD_SERVICES, pricing: { hourly: 4500, overnight: 28000, video: 1800 },
    languages: ['English', 'Swahili'], height: "5'7\"", bodyType: 'Athletic',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: false,
  },
  {
    id: '8', name: 'Naomi J.', age: 24, city: 'Nairobi', area: 'Gigiri',
    lat: -1.2280, lng: 36.8032, tier: 'vip', rating: 4.7, reviews: 134,
    image: U(PHOTOS[7]), gallery: gallery(PHOTOS[7]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: VIP_SERVICES, pricing: { hourly: 7000, overnight: 45000, video: 3000 },
    languages: ['English', 'Swahili', 'German'], height: "5'8\"", bodyType: 'Slim/Tall',
    ethnicity: 'Kenyan', hairColor: 'Natural', available: false, verified: true, online: false,
  },
  {
    id: '9', name: 'Aisha O.', age: 21, city: 'Nairobi', area: 'South B',
    lat: -1.3171, lng: 36.8396, tier: 'standard', rating: 4.4, reviews: 62,
    image: U(PHOTOS[8]), gallery: gallery(PHOTOS[8]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: STD_SERVICES, pricing: { hourly: 2500, overnight: 15000, video: 1000 },
    languages: ['English', 'Swahili', 'Luo'], height: "5'4\"", bodyType: 'Petite/Curvy',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: true,
  },
  {
    id: '10', name: 'Cynthia M.', age: 29, city: 'Nairobi', area: 'Runda',
    lat: -1.2102, lng: 36.8104, tier: 'elite', rating: 4.9, reviews: 178,
    image: U(PHOTOS[9]), gallery: gallery(PHOTOS[9]),
    bio: 'Nairobi\'s finest escort — Runda based, world-class service. A decade of experience in high-end escort services. My clientele are among Kenya\'s most respected professionals. Absolute discretion.',
    services: VIP_SERVICES, pricing: { hourly: 12000, overnight: 75000, video: 4500 },
    languages: ['English', 'French', 'Swahili'], height: "5'9\"", bodyType: 'Slim/Tall',
    ethnicity: 'Kenyan', hairColor: 'Relaxed/Dark', available: true, verified: true, online: true,
  },
  {
    id: '11', name: 'Brenda A.', age: 23, city: 'Nairobi', area: 'Langata',
    lat: -1.3380, lng: 36.7518, tier: 'premium', rating: 4.6, reviews: 88,
    image: U(PHOTOS[10]), gallery: gallery(PHOTOS[10]),
    bio: 'Langata beauty with a playful spirit. I love adventure and bringing joy to the people I meet. Available for short and long engagements. Always punctual and perfectly presented.',
    services: STD_SERVICES, pricing: { hourly: 3500, overnight: 22000, video: 1500 },
    languages: ['English', 'Swahili'], height: "5'5\"", bodyType: 'Curvy',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: false, online: true,
  },
  {
    id: '12', name: 'Diana V.', age: 26, city: 'Nairobi', area: 'Eastleigh',
    lat: -1.2726, lng: 36.8478, tier: 'standard', rating: 4.3, reviews: 54,
    image: U(PHOTOS[11]), gallery: gallery(PHOTOS[11]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: STD_SERVICES, pricing: { hourly: 2000, overnight: 12000, video: 800 },
    languages: ['English', 'Swahili', 'Somali', 'Arabic'], height: "5'6\"", bodyType: 'Slim',
    ethnicity: 'Somali-Kenyan', hairColor: 'Black', available: true, verified: true, online: false,
  },
  {
    id: '13', name: 'Sharon K.', age: 25, city: 'Nairobi', area: 'Embakasi',
    lat: -1.3211, lng: 36.9009, tier: 'standard', rating: 4.2, reviews: 47,
    image: U(PHOTOS[0]), gallery: gallery(PHOTOS[0]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: STD_SERVICES, pricing: { hourly: 1800, overnight: 10000, video: 700 },
    languages: ['English', 'Swahili', 'Kikuyu'], height: "5'3\"", bodyType: 'Average',
    ethnicity: 'Kenyan', hairColor: 'Black', available: false, verified: false, online: false,
  },
  {
    id: '14', name: 'Kezia N.', age: 22, city: 'Nairobi', area: 'Ngong Road',
    lat: -1.3028, lng: 36.7677, tier: 'premium', rating: 4.7, reviews: 103,
    image: U(PHOTOS[1]), gallery: gallery(PHOTOS[1]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: STD_SERVICES, pricing: { hourly: 3800, overnight: 24000, video: 1600 },
    languages: ['English', 'Swahili'], height: "5'6\"", bodyType: 'Slim/Toned',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: true,
  },
  {
    id: '15', name: 'Mercy T.', age: 27, city: 'Nairobi', area: 'Thika Road',
    lat: -1.2253, lng: 36.8944, tier: 'vip', rating: 4.6, reviews: 121,
    image: U(PHOTOS[2]), gallery: gallery(PHOTOS[2]),
    bio: 'Thika Road VIP escort with a bubbly personality and killer looks. Available for bookings citywide. I am passionate about making every client feel like the most important person in the room.',
    services: VIP_SERVICES, pricing: { hourly: 5000, overnight: 30000, video: 2000 },
    languages: ['English', 'Swahili', 'Kikuyu'], height: "5'5\"", bodyType: 'Curvy',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: false,
  },
  {
    id: '16', name: 'Wanjiku G.', age: 30, city: 'Mombasa', area: 'Nyali',
    lat: -4.0165, lng: 39.7057, tier: 'elite', rating: 4.9, reviews: 231,
    image: U(PHOTOS[3]), gallery: gallery(PHOTOS[3]),
    bio: 'The queen of the Kenyan coast — Nyali\'s finest. Bilingual, stunning and endlessly sophisticated. My clientele includes diplomats, executives and discerning travellers visiting Mombasa.',
    services: VIP_SERVICES, pricing: { hourly: 10000, overnight: 60000, video: 4000 },
    languages: ['English', 'Swahili', 'Portuguese'], height: "5'8\"", bodyType: 'Slim/Curvy',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: true, online: true,
  },
  {
    id: '17', name: 'Akinyi B.', age: 23, city: 'Mombasa', area: 'Bamburi',
    lat: -3.9835, lng: 39.7287, tier: 'premium', rating: 4.5, reviews: 76,
    image: U(PHOTOS[4]), gallery: gallery(PHOTOS[4]),
    bio: 'Beach babe from Bamburi, Mombasa. Sun-kissed, carefree and unforgettably sensual. If you\'re visiting the coast, I am your perfect escort for both adventure and intimacy.',
    services: STD_SERVICES, pricing: { hourly: 4000, overnight: 25000, video: 1500 },
    languages: ['English', 'Swahili', 'Luo'], height: "5'5\"", bodyType: 'Athletic',
    ethnicity: 'Luo-Kenyan', hairColor: 'Natural', available: true, verified: true, online: true,
  },
  {
    id: '18', name: 'Amina S.', age: 25, city: 'Mombasa', area: 'Mombasa CBD',
    lat: -4.0435, lng: 39.6682, tier: 'vip', rating: 4.7, reviews: 145,
    image: U(PHOTOS[5]), gallery: gallery(PHOTOS[5]),
    bio: 'Mombasa CBD beauty with coastal charm and big-city sophistication. Experienced with international clientele. Available for hotel visits, port entertainment and private bookings.',
    services: VIP_SERVICES, pricing: { hourly: 5500, overnight: 35000, video: 2200 },
    languages: ['English', 'Swahili', 'Arabic'], height: "5'6\"", bodyType: 'Slim',
    ethnicity: 'Swahili', hairColor: 'Black', available: false, verified: true, online: false,
  },
  {
    id: '19', name: 'Stella R.', age: 24, city: 'Mombasa', area: 'Diani',
    lat: -4.2792, lng: 39.5915, tier: 'vip', rating: 4.8, reviews: 163,
    image: U(PHOTOS[6]), gallery: gallery(PHOTOS[6]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: VIP_SERVICES, pricing: { hourly: 6000, overnight: 40000, video: 2500 },
    languages: ['English', 'Swahili', 'Italian'], height: "5'7\"", bodyType: 'Toned',
    ethnicity: 'Kenyan', hairColor: 'Dark Brown', available: true, verified: true, online: true,
  },
  {
    id: '20', name: 'Janet L.', age: 29, city: 'Mombasa', area: 'Mtwapa',
    lat: -3.9405, lng: 39.7345, tier: 'premium', rating: 4.4, reviews: 83,
    image: U(PHOTOS[7]), gallery: gallery(PHOTOS[7]),
    bio: 'Mtwapa escort offering premium coastal experiences. Mature, confident and extremely accommodating. I specialize in creating relaxed, genuine connections that feel completely natural.',
    services: STD_SERVICES, pricing: { hourly: 3500, overnight: 22000, video: 1400 },
    languages: ['English', 'Swahili'], height: "5'4\"", bodyType: 'Curvy',
    ethnicity: 'Kenyan', hairColor: 'Black', available: true, verified: false, online: false,
  },
  {
    id: '21', name: 'Adhiambo P.', age: 22, city: 'Kisumu', area: 'Milimani',
    lat: -0.0917, lng: 34.7680, tier: 'premium', rating: 4.6, reviews: 69,
    image: U(PHOTOS[8]), gallery: gallery(PHOTOS[8]),
    bio: 'Kisumu\'s premier escort based in upscale Milimani. Luo beauty with an outgoing personality and a warm smile that lights up every room. Happy to host or visit.',
    services: STD_SERVICES, pricing: { hourly: 3000, overnight: 20000, video: 1200 },
    languages: ['English', 'Swahili', 'Luo'], height: "5'5\"", bodyType: 'Petite/Slim',
    ethnicity: 'Luo', hairColor: 'Black', available: true, verified: true, online: true,
  },
  {
    id: '22', name: 'Evalyne O.', age: 26, city: 'Kisumu', area: 'Kisumu CBD',
    lat: -0.1022, lng: 34.7617, tier: 'standard', rating: 4.3, reviews: 44,
    image: U(PHOTOS[9]), gallery: gallery(PHOTOS[9]),
    bio: 'Elite escort based in Nairobi CBD. Sophisticated, discreet, and well-travelled. I specialise in making every encounter feel natural and memorable. Available for dinner dates, travel, events and private encounters.',
    services: STD_SERVICES, pricing: { hourly: 2000, overnight: 13000, video: 800 },
    languages: ['English', 'Swahili', 'Luo'], height: "5'4\"", bodyType: 'Average',
    ethnicity: 'Luo', hairColor: 'Black', available: true, verified: false, online: false,
  },
  {
    id: '23', name: 'Pauline R.', age: 28, city: 'Nakuru', area: 'Nakuru CBD',
    lat: -0.3031, lng: 36.0800, tier: 'premium', rating: 4.5, reviews: 57,
    image: U(PHOTOS[10]), gallery: gallery(PHOTOS[10]),
    bio: 'Rift Valley\'s finest escort based in Nakuru. Calm, collected and deeply sensual. Available to both locals and visitors exploring Kenya\'s breadbasket region.',
    services: STD_SERVICES, pricing: { hourly: 3200, overnight: 20000, video: 1300 },
    languages: ['English', 'Swahili', 'Kikuyu'], height: "5'5\"", bodyType: 'Slim',
    ethnicity: 'Kenyan', hairColor: 'Black', available: false, verified: true, online: false,
  },
  {
    id: '24', name: 'Sandra C.', age: 25, city: 'Nakuru', area: 'Milimani Nakuru',
    lat: -0.2882, lng: 36.0610, tier: 'vip', rating: 4.7, reviews: 92,
    image: U(PHOTOS[11]), gallery: gallery(PHOTOS[11]),
    bio: 'VIP escort in Nakuru\'s prestigious Milimani area. City girl with small-town warmth — I offer a luxury experience at competitive Rift Valley rates. Ideal for business visitors.',
    services: VIP_SERVICES, pricing: { hourly: 4500, overnight: 28000, video: 1800 },
    languages: ['English', 'Swahili'], height: "5'6\"", bodyType: 'Athletic',
    ethnicity: 'Kenyan', hairColor: 'Dark Brown', available: true, verified: true, online: true,
  },
  {
    id: '25', name: 'Faith C.', age: 23, city: 'Eldoret', area: 'Eldoret CBD',
    lat: 0.5143, lng: 35.2698, tier: 'standard', rating: 4.4, reviews: 38,
    image: U(PHOTOS[0]), gallery: gallery(PHOTOS[0]),
    bio: 'North Rift\'s charming escort in Eldoret. Kalenjin beauty with an infectious laugh and genuine spirit. I make every encounter feel special, whether short or extended.',
    services: STD_SERVICES, pricing: { hourly: 2200, overnight: 14000, video: 900 },
    languages: ['English', 'Swahili', 'Kalenjin'], height: "5'6\"", bodyType: 'Slim/Athletic',
    ethnicity: 'Kalenjin', hairColor: 'Black', available: true, verified: false, online: false,
  },
]

export const CITIES = [
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, areas: ['Nairobi CBD', 'Westlands', 'Karen', 'Kilimani', 'Lavington', 'Parklands', 'Upperhill', 'Langata', 'South B', 'Gigiri', 'Runda', 'Eastleigh', 'Embakasi', 'Ngong Road', 'Thika Road'] },
  { name: 'Mombasa', lat: -4.0435, lng: 39.6682, areas: ['Mombasa CBD', 'Nyali', 'Bamburi', 'Diani', 'Mtwapa'] },
  { name: 'Kisumu',  lat: -0.1022, lng: 34.7617, areas: ['Kisumu CBD', 'Milimani', 'Kondele', 'Mamboleo'] },
  { name: 'Nakuru',  lat: -0.3031, lng: 36.0800, areas: ['Nakuru CBD', 'Milimani Nakuru', 'Lanet'] },
  { name: 'Eldoret', lat: 0.5143,  lng: 35.2698, areas: ['Eldoret CBD', 'Elgon View', 'Kipkorir'] },
  { name: 'Thika',   lat: -1.0332, lng: 37.0693, areas: ['Thika CBD', 'Ngei'] },
]

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function sortByLocation(escorts: Escort[], userLat?: number, userLng?: number, userCity?: string): Escort[] {
  if (userLat !== undefined && userLng !== undefined) {
    return [...escorts].sort((a, b) =>
      distanceKm(userLat, userLng, a.lat, a.lng) - distanceKm(userLat, userLng, b.lat, b.lng)
    )
  }
  if (userCity) {
    return [...escorts].sort((a, b) => {
      const aMatch = a.city === userCity ? 0 : 1
      const bMatch = b.city === userCity ? 0 : 1
      return aMatch - bMatch
    })
  }
  return escorts
}

const EXTRA_NAMES = ['Monica','Victoria','Elena','Tasha','Blessing','Angel','Precious','Ruth','Esther','Lydia','Gloria','Joy','Hope','Carol','Susan','Patricia','Christine','Beatrice']

export function generateMoreEscorts(count: number, seed = 0): Escort[] {
  return Array.from({ length: count }, (_, i) => {
    const idx = (i + seed) % ESCORTS.length
    const base = ESCORTS[idx]
    const nameIdx = (i + seed) % EXTRA_NAMES.length
    return {
      ...base,
      id: `gen-${seed}-${i}`,
      name: `${EXTRA_NAMES[nameIdx]} ${String.fromCharCode(65 + (i % 26))}.`,
      rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
      reviews: 20 + Math.floor(Math.random() * 200),
      available: Math.random() > 0.3,
      online: Math.random() > 0.5,
    }
  })
}
