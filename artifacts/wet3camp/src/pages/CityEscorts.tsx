import React, { useState, useEffect } from 'react'
import { Link, useRoute } from 'wouter'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import SeoFooter from '@/components/SeoFooter'
import { useSEO } from '@/lib/useSEO'
import { api } from '@/lib/api'
import { ChevronRight, MapPin, Shield, Star } from 'lucide-react'

const CITY_DATA: Record<string, {
  displayName: string
  description: string
  areas: string[]
  intro: string
  faqs: { q: string; a: string }[]
  hotels: string[]
  image: string
  tier: string
  population: string
}> = {
  nairobi: {
    displayName: 'Nairobi',
    description: "Kenya's capital and East Africa's premier city for verified escorts. 800+ profiles across Westlands, Kilimani, Karen and CBD.",
    areas: ['Westlands', 'Kilimani', 'Karen', 'Lavington', 'Parklands', 'Upperhill', 'Gigiri', 'Runda', 'CBD', 'South B', 'Langata'],
    intro: `Nairobi is Kenya's capital city and home to the largest, most diverse escort scene in East Africa. Whether you're a business traveller, tourist, or local resident, Wet3Camp makes it easy to find verified, reviewed escorts across all of Nairobi's major areas.`,
    faqs: [
      { q: 'How much do escorts in Nairobi cost?', a: 'Elite escorts charge KES 8,000–15,000/hr. VIP escorts charge KES 5,000–8,000/hr. Premium escorts charge KES 3,000–5,000/hr. Standard escorts charge KES 1,500–3,000/hr.' },
      { q: 'What are the best areas in Nairobi to find escorts?', a: 'Westlands, Kilimani and Karen have the highest concentrations of verified escorts. Westlands is best for hotel-based meetups near 5-star properties.' },
      { q: 'Are Nairobi escorts available for overnight bookings?', a: 'Yes. Most VIP and Elite escorts in Nairobi offer overnight bookings (8–12hrs). Overnight rates typically range from KES 15,000 (VIP) to KES 50,000 (Elite).' },
      { q: 'How do I book an escort in Nairobi safely?', a: 'Browse verified profiles on Wet3Camp, look for the ✓ Verified badge, read reviews, then contact via the WhatsApp button. Always confirm rates and services before meeting.' },
    ],
    hotels: ['Sankara Nairobi', 'Villa Rosa Kempinski', 'Crowne Plaza', 'The Boma', 'Ole Sereni', 'Radisson Blu'],
    image: 'https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1200&h=400&fit=crop',
    tier: 'Elite & VIP',
    population: '4.4 million',
  },
  mombasa: {
    displayName: 'Mombasa',
    description: "Kenya's premier coastal city. Find verified escorts in Nyali, Bamburi, Diani and Mtwapa — perfect for resort and beach bookings.",
    areas: ['Nyali', 'Bamburi', 'Diani', 'Mtwapa', 'Tudor', 'Likoni', 'Kisauni', 'Mombasa CBD'],
    intro: `Mombasa is Kenya's second-largest city and the country's top beach destination. The Mombasa escort scene caters to international tourists, business visitors at the port, and expat residents. With Wet3Camp, you can find verified, reviewed escorts across Nyali, Bamburi, Diani Beach and the CBD.`,
    faqs: [
      { q: 'How much do escorts in Mombasa cost?', a: 'Mombasa rates are slightly lower than Nairobi. Elite: KES 7,000–12,000/hr. VIP: KES 4,000–7,000/hr. Premium: KES 2,500–4,500/hr.' },
      { q: 'Are there escorts available in Diani Beach?', a: 'Yes. Several escorts are based in or travel to Diani for bookings. Filter by city on Wet3Camp and look for Diani area escorts or those willing to travel.' },
      { q: 'What hotels in Mombasa are good for escort meetups?', a: 'Sarova Whitesands, Voyager Beach Resort, English Point Marina, and Tamarind Beach Hotel are all popular, discreet options.' },
      { q: 'Are Mombasa escorts available for multi-day beach holiday bookings?', a: 'Yes. Many Mombasa and Diani escorts offer travel companion rates for multi-day beach holiday bookings. Ask about daily rates in your WhatsApp enquiry.' },
    ],
    hotels: ['Sarova Whitesands', 'Voyager Beach Resort', 'English Point Marina', 'Tamarind Beach Hotel', 'Nyali Beach Hotel'],
    image: 'https://images.unsplash.com/photo-1504214208698-ea1916a2195a?w=1200&h=400&fit=crop',
    tier: 'VIP & Premium',
    population: '1.2 million',
  },
  kisumu: {
    displayName: 'Kisumu',
    description: "Kenya's lakeside city on Lake Victoria. Find verified escorts in Kisumu — a growing scene for business travellers and NGO workers.",
    areas: ['Milimani', 'Mega City', 'Kisumu CBD', 'Mamboleo', 'Kondele', 'Nyalenda'],
    intro: `Kisumu is Kenya's third-largest city, beautifully situated on Lake Victoria's shores. With a thriving business and NGO sector, the escort scene here serves a discerning clientele of business professionals and international visitors. Wet3Camp lists verified escorts across Kisumu's key areas.`,
    faqs: [
      { q: 'How much do escorts cost in Kisumu?', a: 'Kisumu rates are 20–30% lower than Nairobi. VIP: KES 4,000–6,000/hr. Premium: KES 2,500–4,000/hr. Standard: KES 1,500–2,500/hr.' },
      { q: 'Where do most escorts in Kisumu operate?', a: 'Milimani Estate is the main hub, followed by the Mega City area and hotels near Kisumu CBD.' },
      { q: 'What hotels in Kisumu are best for escort meetups?', a: 'Sovereign Hotel, Imperial Hotel Kisumu, Acacia Premier Hotel, and Kiboko Bay Resort are the top options.' },
      { q: 'Are Kisumu escorts available on Wet3Camp?', a: 'Yes. Filter the search page by City → Kisumu to see all verified profiles in Kisumu.' },
    ],
    hotels: ['Sovereign Hotel', 'Imperial Hotel Kisumu', 'Acacia Premier Hotel', 'Kiboko Bay Resort'],
    image: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&h=400&fit=crop',
    tier: 'VIP & Premium',
    population: '610,000',
  },
  nakuru: {
    displayName: 'Nakuru',
    description: "Rift Valley's capital city. Find verified escorts in Nakuru — serving business travellers, tourists visiting Lake Nakuru and local clients.",
    areas: ['Milimani', 'Nakuru CBD', 'Section 58', 'Lanet', 'Pipeline', 'Shabab'],
    intro: `Nakuru is Kenya's fourth-largest city and the capital of Rift Valley County. Famous for Lake Nakuru and its flamingo populations, the city also has a vibrant business scene. Wet3Camp connects you with verified, reviewed escorts across Nakuru's key areas.`,
    faqs: [
      { q: 'How much do escorts cost in Nakuru?', a: 'VIP escorts in Nakuru charge KES 4,000–6,000/hr. Premium escorts charge KES 2,500–4,000/hr. Standard escorts charge KES 1,500–2,500/hr.' },
      { q: 'What is the best area to find escorts in Nakuru?', a: 'Milimani Estate has the highest concentration of verified escorts in Nakuru.' },
      { q: 'What hotels in Nakuru are good for escort meetups?', a: 'Merica Hotel Nakuru and Waterbuck Hotel are the most popular and discreet options.' },
      { q: 'Can I book an escort for Lake Nakuru National Park visits?', a: 'Yes. Several Nakuru escorts offer travel companion bookings for safari day trips to Lake Nakuru National Park.' },
    ],
    hotels: ['Merica Hotel Nakuru', 'Waterbuck Hotel', 'Sarova Lion Hill Game Lodge'],
    image: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&h=400&fit=crop',
    tier: 'Premium & Standard',
    population: '570,000',
  },
  eldoret: {
    displayName: 'Eldoret',
    description: "Kenya's athletics capital. Find verified escorts in Eldoret — serving the western Kenya business hub and university city.",
    areas: ['Elgon View', 'Elgon Road', 'Pioneer', 'Eldoret CBD', 'Huruma', 'Langas'],
    intro: `Eldoret is Kenya's fifth-largest city and the country's athletics capital — home of world champions. As a major commercial and university hub in western Kenya, it has a growing escort scene. Wet3Camp connects you with verified escorts across Eldoret's main areas.`,
    faqs: [
      { q: 'How much do escorts cost in Eldoret?', a: 'VIP escorts in Eldoret charge KES 3,500–5,500/hr. Premium escorts charge KES 2,000–3,500/hr. Standard escorts charge KES 1,200–2,000/hr.' },
      { q: 'Where are escorts in Eldoret based?', a: 'Most escorts in Eldoret are based in Elgon View and Pioneer areas.' },
      { q: 'What are the best hotels for escort meetups in Eldoret?', a: 'Sirikwa Hotel and Hotel Boma are the most popular and discreet options in Eldoret.' },
      { q: 'Are there verified escorts in Eldoret on Wet3Camp?', a: 'Yes. Filter the search page by City → Eldoret to see all verified Eldoret escort profiles.' },
    ],
    hotels: ['Sirikwa Hotel', 'Hotel Boma', 'Four Points by Sheraton Eldoret'],
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=400&fit=crop',
    tier: 'Premium & Standard',
    population: '475,000',
  },
}

export default function CityEscorts() {
  const [, params] = useRoute('/escorts/:city')
  const cityKey = (params?.city ?? '').toLowerCase()
  const city = CITY_DATA[cityKey]

  const [escorts, setEscorts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useSEO({
    title: city
      ? `${city.displayName} Escorts 2025 — Verified Female Escorts in ${city.displayName} | Wet3Camp`
      : 'Kenya Escorts | Wet3Camp',
    description: city?.description ?? 'Find verified escorts in Kenya on Wet3Camp.',
    keywords: city
      ? `${city.displayName} escorts, escorts in ${city.displayName} Kenya, verified escorts ${city.displayName}, ${city.displayName} escort guide 2025, ${city.areas.slice(0, 3).map(a => `${a} escorts`).join(', ')}`
      : undefined,
    canonicalPath: `/escorts/${cityKey}`,
  })

  useEffect(() => {
    if (!city) return
    setLoading(true)
    api.escorts.list({ city: city.displayName, limit: 24 })
      .then(res => { setEscorts(res.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [cityKey])

  if (!city) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="flex-1 min-w-0">
          <Header />
          <div className="flex items-center justify-center h-64 text-text-muted">City not found.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-dark-bg">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <Header />
        <main>
          {/* Hero */}
          <div className="relative h-56 overflow-hidden">
            <img src={city.image} alt={`${city.displayName} escorts`} className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                <Link href="/" className="hover:text-[#8B0000]">Home</Link>
                <ChevronRight size={10} />
                <span>Escorts</span>
                <ChevronRight size={10} />
                <span className="text-text-light">{city.displayName}</span>
              </div>
              <h1 className="text-3xl font-black text-text-light">{city.displayName} Escorts</h1>
              <p className="text-sm text-text-muted mt-1">{city.description}</p>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-4 py-8">
            {/* Stats bar */}
            <div className="flex flex-wrap gap-4 mb-8 p-4 bg-card-bg border border-color rounded-xl">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={14} className="text-[#8B0000]" />
                <span className="text-text-muted">Population: <strong className="text-text-light">{city.population}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={14} className="text-green-400" />
                <span className="text-text-muted">All profiles verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star size={14} className="text-yellow-400" />
                <span className="text-text-muted">Top tier: <strong className="text-text-light">{city.tier}</strong></span>
              </div>
              <Link href={`/search?city=${city.displayName}`} className="ml-auto inline-flex items-center gap-1 px-4 py-1.5 bg-[#8B0000] text-white text-xs font-bold rounded-lg hover:bg-[#a00000] transition-all">
                All {city.displayName} Escorts <ChevronRight size={12} />
              </Link>
            </div>

            {/* Intro */}
            <div className="mb-8">
              <p className="text-sm text-text-muted leading-relaxed">{city.intro}</p>
            </div>

            {/* Areas */}
            <div className="mb-8">
              <h2 className="text-lg font-black text-text-light mb-3">Top Areas in {city.displayName}</h2>
              <div className="flex flex-wrap gap-2">
                {city.areas.map(area => (
                  <Link
                    key={area}
                    href={`/search?city=${city.displayName}&q=${encodeURIComponent(area)}`}
                    className="flex items-center gap-1 px-3 py-1.5 bg-card-bg border border-color rounded-full text-xs text-text-muted hover:border-[#8B0000]/50 hover:text-text-light transition-all"
                  >
                    <MapPin size={10} className="text-[#8B0000]" /> {area}
                  </Link>
                ))}
              </div>
            </div>

            {/* Escort grid */}
            <div className="mb-10">
              <h2 className="text-lg font-black text-text-light mb-4">
                Verified Escorts in {city.displayName}
                {!loading && escorts.length > 0 && <span className="text-sm font-normal text-text-muted ml-2">({escorts.length} profiles)</span>}
              </h2>
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-card-bg rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : escorts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {escorts.map(e => (
                    <Link key={e.id} href={`/@${e.id}`} className="group block">
                      <div className="bg-card-bg border border-color rounded-xl overflow-hidden hover:border-[#8B0000]/40 transition-all">
                        <div className="aspect-[3/4] overflow-hidden relative">
                          <img
                            src={e.image || '/api/placeholder-escort.jpg'}
                            alt={e.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={ev => { (ev.target as HTMLImageElement).src = '/api/placeholder-escort.jpg' }}
                          />
                          {e.verified && (
                            <span className="absolute top-2 right-2 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">✓</span>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="text-white text-xs font-bold truncate">{e.name}</p>
                            <p className="text-white/60 text-[10px]">{e.area} · {e.age}yrs</p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-text-muted">
                  <p className="mb-4">No profiles loaded yet — browse our full directory.</p>
                  <Link href={`/search?city=${city.displayName}`} className="inline-flex items-center gap-1 px-4 py-2 bg-[#8B0000] text-white text-sm font-bold rounded-lg">
                    Search {city.displayName} Escorts
                  </Link>
                </div>
              )}
              {escorts.length > 0 && (
                <div className="mt-4 text-center">
                  <Link href={`/search?city=${city.displayName}`} className="inline-flex items-center gap-1 px-5 py-2.5 border border-[#8B0000] text-[#8B0000] text-sm font-bold rounded-xl hover:bg-[#8B0000] hover:text-white transition-all">
                    See All {city.displayName} Escorts <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </div>

            {/* Hotels */}
            <div className="mb-8">
              <h2 className="text-lg font-black text-text-light mb-3">Top Hotels for Escort Meetups in {city.displayName}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {city.hotels.map(hotel => (
                  <div key={hotel} className="flex items-center gap-2 p-3 bg-card-bg border border-color rounded-lg text-xs text-text-muted">
                    <Shield size={10} className="text-[#8B0000] flex-shrink-0" />
                    {hotel}
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ — structured data for SEO */}
            <div className="mb-8">
              <h2 className="text-lg font-black text-text-light mb-4">FAQ — Escorts in {city.displayName}</h2>
              <div className="space-y-3">
                {city.faqs.map((faq, i) => (
                  <details key={i} className="bg-card-bg border border-color rounded-xl p-4">
                    <summary className="text-sm font-bold text-text-light cursor-pointer">{faq.q}</summary>
                    <p className="text-sm text-text-muted mt-3 leading-relaxed">{faq.a}</p>
                  </details>
                ))}
              </div>
            </div>

            {/* FAQ JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: city.faqs.map(faq => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }) }} />

            {/* Breadcrumb JSON-LD */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Wet3Camp', item: 'https://wet3.camp' },
                { '@type': 'ListItem', position: 2, name: 'Escorts', item: 'https://wet3.camp/search' },
                { '@type': 'ListItem', position: 3, name: `${city.displayName} Escorts`, item: `https://wet3.camp/escorts/${cityKey}` },
              ],
            }) }} />

            {/* CTA */}
            <div className="mt-8 p-6 bg-gradient-to-br from-[#8B0000]/20 to-transparent border border-[#8B0000]/30 rounded-2xl text-center">
              <h3 className="text-base font-black text-text-light mb-1">Ready to Browse {city.displayName} Escorts?</h3>
              <p className="text-xs text-text-muted mb-4">All profiles verified · Browse free · Book via WhatsApp</p>
              <div className="flex justify-center gap-3">
                <Link href={`/search?city=${city.displayName}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B0000] text-white text-sm font-black rounded-xl hover:bg-[#a00000] transition-all">
                  Browse Escorts <ChevronRight size={14} />
                </Link>
                <Link href="/register" className="inline-flex items-center gap-2 px-5 py-2.5 border border-color text-text-muted text-sm font-bold rounded-xl hover:border-[#8B0000]/50 transition-all">
                  Join Free
                </Link>
              </div>
            </div>
          </div>
        </main>
        <SeoFooter />
      </div>
    </div>
  )
}
