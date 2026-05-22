// SEO Metadata Generator for All Pages
// Includes meta tags, og tags, structured data, and schemas

export const seoConfig = {
  siteName: 'Wet3Camp',
  siteUrl: 'https://wet3camp.com',
  defaultLocale: 'en_KE',
  twitterHandle: '@wet3camp',
  defaultImage: 'https://wet3camp.com/og-image.jpg',
}

// Home Page SEO
export const homePageSEO = {
  title: 'Wet3Camp - Premium Escort Booking Platform | Book Verified Escorts Online',
  description: 'Discover verified escorts in Kenya. Safe, discreet, and reliable escort booking platform. Browse profiles, read reviews, and book appointments instantly.',
  keywords: 'escort booking, companion booking, premium escorts, verified escorts, Kenya escorts, escort services',
  ogImage: 'https://wet3camp.com/og-home.jpg',
  ogType: 'website',
  canonicalUrl: 'https://wet3camp.com',
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Wet3Camp',
    url: 'https://wet3camp.com',
    description: 'Premium escort booking platform in Kenya',
    searchAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://wet3camp.com/search?q={search_term_string}',
      },
    },
  },
}

// Escort Profile SEO (Dynamic)
export const getEscortProfileSEO = (profile: any) => ({
  title: `${profile.name}, ${profile.age} - ${profile.location} | Wet3Camp Escorts`,
  description: `Meet ${profile.name}, a verified ${profile.age}-year-old escort in ${profile.location}. ${profile.rating} ⭐ rating from ${profile.reviews} reviews. Book now for ${profile.services.length} services.`,
  keywords: `${profile.name}, ${profile.location} escort, companion booking, verified escort, ${profile.ethnicity} escort`,
  ogImage: profile.image,
  ogType: 'profile',
  canonicalUrl: `https://wet3camp.com/profile/${profile.id}`,
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    image: profile.image,
    description: profile.bio,
    areaServed: profile.location,
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: profile.rating,
      reviewCount: profile.reviews,
    },
    address: {
      '@type': 'PostalAddress',
      addressLocality: profile.location,
      addressCountry: 'KE',
    },
    url: `https://wet3camp.com/profile/${profile.id}`,
  },
})

// Search Results Page SEO
export const searchPageSEO = (query: string, location: string) => ({
  title: `Escorts in ${location} - ${query ? `${query} - ` : ''}Wet3Camp Verified Booking Platform`,
  description: `Find verified escorts in ${location}. Browse ${query || 'all'} escort profiles with photos, reviews, rates & booking options. Safe & discreet.`,
  keywords: `${location} escorts, escort services ${location}, companion booking ${location}, verified escorts, escort rates`,
  ogImage: 'https://wet3camp.com/og-search.jpg',
  ogType: 'website',
  canonicalUrl: `https://wet3camp.com/search?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`,
})

// Reviews Page SEO
export const reviewsPageSEO = {
  title: 'Verified Escort Reviews | Wet3Camp - Authentic Client Feedback',
  description: 'Read verified client reviews of escorts on Wet3Camp. Authentic ratings, photos, and honest feedback from verified bookings. Find trusted escorts.',
  keywords: 'escort reviews, verified reviews, client feedback, escort ratings, honest reviews',
  ogImage: 'https://wet3camp.com/og-reviews.jpg',
  ogType: 'website',
  canonicalUrl: 'https://wet3camp.com/reviews',
}

// Verify this is a LocalBusiness (for local SEO in Kenya)
export const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Wet3Camp',
  image: 'https://wet3camp.com/logo.png',
  description: 'Premium escort booking platform in Kenya',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Nairobi',
    addressRegion: 'Nairobi',
    postalCode: '00100',
    addressCountry: 'KE',
  },
  telephone: '+254-XXX-XXX-XXX',
  url: 'https://wet3camp.com',
  priceRange: '$$',
  areaServed: 'KE',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.7',
    reviewCount: '2341',
  },
}

// BreadcrumbList for Navigation
export const getBreadcrumbs = (path: string) => {
  const segments = path.split('/').filter(Boolean)
  const breadcrumbs = [
    { name: 'Home', url: 'https://wet3camp.com' },
  ]

  segments.forEach((segment, index) => {
    const url = `https://wet3camp.com/${segments.slice(0, index + 1).join('/')}`
    breadcrumbs.push({
      name: segment.charAt(0).toUpperCase() + segment.slice(1),
      url,
    })
  })

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// FAQ Schema for common questions
export const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How do I book an escort on Wet3Camp?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Browse profiles, select your preferred escort, check availability, and proceed with booking. Payment is secure and confidential.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are escorts on Wet3Camp verified?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, all escorts go through our verification process including ID verification and approval photos for safety.',
      },
    },
    {
      '@type': 'Question',
      name: 'What payment methods do you accept?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We accept M-Pesa, cards, PayPal, and bank transfers for secure and convenient payments.',
      },
    },
    {
      '@type': 'Question',
      name: 'Is my booking information private?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, we take privacy seriously. All booking information is encrypted and confidential.',
      },
    },
  ],
}

// Social Media Card Meta Tags
export const generateOpenGraphTags = (metadata: any) => ({
  'og:title': metadata.title,
  'og:description': metadata.description,
  'og:image': metadata.ogImage,
  'og:type': metadata.ogType || 'website',
  'og:url': metadata.canonicalUrl,
  'og:site_name': seoConfig.siteName,
  'og:locale': seoConfig.defaultLocale,
})

export const generateTwitterTags = (metadata: any) => ({
  'twitter:card': 'summary_large_image',
  'twitter:title': metadata.title,
  'twitter:description': metadata.description,
  'twitter:image': metadata.ogImage,
  'twitter:creator': seoConfig.twitterHandle,
})

// Robots.txt content
export const robotsContent = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /admin-*
Disallow: /*?*sort=
Sitemap: https://wet3camp.com/sitemap.xml

User-agent: Googlebot
Allow: /
Disallow: /admin/
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Disallow: /admin/
Crawl-delay: 1`

// Sitemap generation
export const generateSitemap = (escortCount: number) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://wet3camp.com</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changeq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://wet3camp.com/search</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://wet3camp.com/reviews</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://wet3camp.com/about</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`

// Meta tags for specific locations
export const getLocationSEO = (location: string) => ({
  title: `Escorts in ${location} | Verified Bookings | Wet3Camp`,
  description: `Find verified escorts in ${location}. Safe, discreet escort booking with verified profiles, reviews, and instant booking options.`,
  keywords: `${location} escorts, escort services ${location}, companion booking, verified escorts in ${location}`,
})

// Canonical URLs for duplicate content prevention
export const getCanonicalUrl = (path: string) => {
  const cleanPath = path.split('?')[0].split('#')[0]
  return `https://wet3camp.com${cleanPath}`
}
