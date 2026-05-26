export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  publishedAt: string
  updatedAt: string
  imageUrl: string
  readTime: number
  published: boolean
  seoTitle?: string
  seoDescription?: string
}

export const BLOG_CATEGORIES = [
  'Safety Tips', 'Kenya Escorts Guide', 'Nairobi Nightlife', 'Mombasa Escorts',
  'Booking Tips', 'Platform News', 'Escort Reviews', 'Travel Companions'
]

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: '1',
    slug: 'how-to-find-verified-escorts-nairobi',
    title: 'How to Find Verified Escorts in Nairobi — Complete 2025 Guide',
    excerpt: 'Finding a verified, safe escort in Nairobi can be overwhelming. This complete guide walks you through everything you need to know — from choosing the right tier to booking safely.',
    content: `## Finding Verified Escorts in Nairobi

Nairobi is Kenya's capital and home to the largest concentration of verified, professional escorts in East Africa. Whether you're a local or a visiting professional, this guide will help you navigate the scene safely and discreetly.

### Why Verification Matters

At Wet3Camp, all escorts go through a multi-step verification process:
- **ID Verification** — Government-issued ID confirmed
- **Photo Verification** — Live selfie matched to profile photos
- **Phone Verification** — Confirmed active Kenyan number

Only verified profiles earn the ✓ Verified badge. Always look for this before booking.

### Understanding the Tier System

**Elite Escorts (KES 8,000–15,000/hr)**
Top-tier companions with extensive experience. Ideal for high-profile events, business dinners, and overnight bookings.

**VIP Escorts (KES 5,000–8,000/hr)**
Premium service with a wide range of offerings. Most popular choice for discerning clients.

**Premium Escorts (KES 3,000–5,000/hr)**
Great balance of quality and value. Well-reviewed and professional.

**Standard Escorts (KES 1,500–3,000/hr)**
Budget-friendly options without compromising on safety.

### Top Areas in Nairobi

- **Westlands** — Most popular area, central and safe
- **Karen** — Upscale, exclusive, ideal for Elite bookings
- **Kilimani** — Vibrant scene, great for VIP bookings
- **Parklands** — Growing hub with many verified profiles
- **Nairobi CBD** — Central access, good for hotel meetups

### How to Book Safely

1. Browse profiles on Wet3Camp — filter by area, tier and availability
2. Check the ✓ Verified badge and read reviews
3. Contact via WhatsApp (button on profile) — message is pre-filled with your interest
4. Agree on location, duration and rate before meeting
5. Always meet in a safe, public location first

### Red Flags to Avoid

- No verified badge
- Asking for payment upfront before meeting
- Profile with no reviews
- Pressure to move off-platform immediately

Stay safe. Browse verified. Book with confidence on Wet3Camp.`,
    author: 'Wet3Camp Editorial',
    category: 'Kenya Escorts Guide',
    tags: ['Nairobi escorts', 'verified escorts', 'escort guide Kenya', 'how to book escort'],
    publishedAt: '2025-05-20',
    updatedAt: '2025-05-20',
    imageUrl: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=800&h=450&fit=crop',
    readTime: 6,
    published: true,
    seoTitle: 'How to Find Verified Escorts in Nairobi 2025 — Safe Booking Guide',
    seoDescription: 'Complete guide to finding verified escorts in Nairobi, Kenya. Learn about tiers, safety tips, top areas and how to book safely on Wet3Camp.',
  },
  {
    id: '2',
    slug: 'mombasa-escort-guide-2025',
    title: 'Mombasa Escorts 2025 — The Ultimate Coastal Guide',
    excerpt: 'Mombasa is Kenya\'s premier coastal city and home to some of the most sought-after escorts in East Africa. Here\'s everything you need to know about the Mombasa escort scene.',
    content: `## Mombasa Escorts — Kenya's Coastal Capital

Mombasa attracts thousands of visitors every year — tourists, business travellers, and expats — all looking for premium companionship in one of Africa's most beautiful coastal cities.

### Why Mombasa Escorts Stand Out

The Mombasa escort scene is unique for several reasons:
- **Coastal beauty** — Many escorts are of Swahili, coastal Kenyan and mixed heritage
- **International clientele** — High English proficiency, experience with diverse cultures
- **Resort-friendly** — Available for hotel visits, beach excursions, and resort stays

### Top Areas in Mombasa

**Nyali** — The upscale suburb north of Mombasa Island. Home to elite and VIP escorts catering to high-end resorts and expat communities.

**Bamburi** — Beach town with a relaxed atmosphere. Popular for overnight and multi-day bookings.

**Diani** — South of Mombasa, Kenya's most famous beach destination. Perfect for travel companion bookings.

**Mombasa CBD** — Central access for hotel meetups and business visitors at port-side hotels.

**Mtwapa** — Growing area north of Mombasa with more affordable options.

### Pricing in Mombasa

Rates in Mombasa are slightly lower than Nairobi on average, making it excellent value:
- Elite: KES 7,000–12,000/hr
- VIP: KES 4,000–7,000/hr
- Premium: KES 2,500–4,500/hr

### Booking Tips for Mombasa

Always book through Wet3Camp's verified platform. All profiles are verified — look for the ✓ badge. Use the WhatsApp button on any profile to initiate contact with a pre-filled booking message.`,
    author: 'Wet3Camp Editorial',
    category: 'Mombasa Escorts',
    tags: ['Mombasa escorts', 'coastal Kenya escorts', 'Nyali escorts', 'Diani escorts'],
    publishedAt: '2025-05-15',
    updatedAt: '2025-05-15',
    imageUrl: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=800&h=450&fit=crop',
    readTime: 5,
    published: true,
    seoTitle: 'Mombasa Escorts 2025 — Complete Coastal Kenya Guide | Wet3Camp',
    seoDescription: 'Find verified escorts in Mombasa, Nyali, Bamburi, Diani and Mtwapa. Complete guide to the Mombasa escort scene with pricing, areas and safety tips.',
  },
  {
    id: '3',
    slug: 'escort-safety-tips-kenya',
    title: 'Escort Safety Tips for Clients in Kenya — Stay Safe Every Time',
    excerpt: 'Safety is the number one priority on Wet3Camp. Here are our top tips for clients to ensure every encounter is safe, discreet and professional.',
    content: `## Safety First — Escort Booking Safety Tips

Whether you're a first-time client or experienced, safety should always come first. Here's Wet3Camp's official guide to safe escort bookings in Kenya.

### Before You Book

**Verify the profile** — Only use escorts with the ✓ Verified badge. This means their identity has been confirmed by our team.

**Read reviews** — Real client reviews are posted on every profile. Look for consistency and detail. Be wary of profiles with no reviews.

**Use the platform** — Always initiate contact through Wet3Camp's WhatsApp button. This ensures you're contacting the verified profile, not a scammer using stolen photos.

### During Contact

**Be clear about your needs** — Clearly communicate your desired duration, location, and the services you're interested in.

**Agree on rates upfront** — Confirm the total cost before meeting. Never accept surprise charges.

**Use your real details** — Don't use fake names or numbers. Professional escorts prefer genuine clients.

### Meeting Safely

**First meeting in public** — If meeting someone for the first time, start at a café, hotel lobby or restaurant.

**Use your own transport** — Don't get into a stranger's car for a first meeting.

**Tell someone** — Let a trusted friend know where you're going and when to expect you back.

**Hotel bookings** — Many escorts prefer hotel meetings. Book a reputable hotel and share the details in advance.

### Red Flags

- Asking for M-Pesa payment before meeting
- Refusing to video-verify before an overnight booking
- Profile photos that reverse image search to other sites
- Pressure tactics or urgent requests

Stay safe. Browse verified profiles only on Wet3Camp.`,
    author: 'Wet3Camp Safety Team',
    category: 'Safety Tips',
    tags: ['escort safety Kenya', 'safe escort booking', 'client safety tips'],
    publishedAt: '2025-05-10',
    updatedAt: '2025-05-10',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&h=450&fit=crop',
    readTime: 4,
    published: true,
    seoTitle: 'Escort Safety Tips Kenya — How to Book Safely | Wet3Camp',
    seoDescription: 'Top safety tips for booking escorts in Kenya. Learn how to verify profiles, meet safely and avoid scams on Wet3Camp.',
  },
]

const STORAGE_KEY = 'wet3camp_blog_posts'

export function getBlogPosts(): BlogPost[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved) as BlogPost[]
      if (parsed.length > 0) return parsed
    }
  } catch { /* ignore */ }
  return INITIAL_POSTS
}

export function saveBlogPosts(posts: BlogPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
  } catch { /* ignore */ }
}

export function getPublishedPosts(): BlogPost[] {
  return getBlogPosts().filter(p => p.published).sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getBlogPosts().find(p => p.slug === slug)
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
