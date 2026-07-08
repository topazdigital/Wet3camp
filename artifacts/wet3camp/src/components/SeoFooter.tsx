import React from 'react'
import { Link } from 'wouter'

const CITIES = [
  { name: 'Nairobi', slug: 'nairobi' },
  { name: 'Mombasa', slug: 'mombasa' },
  { name: 'Kisumu', slug: 'kisumu' },
  { name: 'Nakuru', slug: 'nakuru' },
  { name: 'Eldoret', slug: 'eldoret' },
]

const NAIROBI_AREAS = ['Westlands', 'Kilimani', 'Karen', 'Lavington', 'Parklands', 'CBD']

const SERVICES = [
  'Massage', 'GFE', 'Overnight', 'Incall', 'Outcall', 'Dinner Dates',
  'BDSM', 'Travel Escort', 'Duo', 'Roleplay',
]

const TIERS = ['Elite', 'VIP', 'Premium', 'Standard']

const RESOURCES = [
  { label: 'Blog & Guides', href: '/blog' },
  { label: 'Safety Tips', href: '/blog/escort-safety-tips-kenya' },
  { label: 'Escort Rates 2025', href: '/blog/nairobi-escort-rates-2025' },
  { label: 'FAQs', href: '/faqs' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'Contact', href: '/contact' },
]

export default function SeoFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="border-t border-color bg-card-bg/40 mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-8 mb-8">
          <div>
            <h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-3">Cities</h3>
            <ul className="space-y-2">
              {CITIES.map(c => (
                <li key={c.slug}>
                  <Link href={`/escorts/${c.slug}`} className="text-xs text-text-muted hover:text-[#8B0000] transition-colors">
                    {c.name} Escorts
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-3">Nairobi Areas</h3>
            <ul className="space-y-2">
              {NAIROBI_AREAS.map(area => (
                <li key={area}>
                  <Link href={`/search?city=Nairobi&q=${encodeURIComponent(area)}`} className="text-xs text-text-muted hover:text-[#8B0000] transition-colors">
                    {area} Escorts
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-3">Services</h3>
            <ul className="space-y-2">
              {SERVICES.map(svc => (
                <li key={svc}>
                  <Link href={`/search?service=${encodeURIComponent(svc.toLowerCase())}`} className="text-xs text-text-muted hover:text-[#8B0000] transition-colors">
                    {svc} Escorts
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-3">Tiers</h3>
            <ul className="space-y-2">
              {TIERS.map(tier => (
                <li key={tier}>
                  <Link href={`/search?tier=${tier.toLowerCase()}`} className="text-xs text-text-muted hover:text-[#8B0000] transition-colors">
                    {tier} Escorts
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-text-light uppercase tracking-widest mb-3">Resources</h3>
            <ul className="space-y-2">
              {RESOURCES.map(r => (
                <li key={r.href}>
                  <Link href={r.href} className="text-xs text-text-muted hover:text-[#8B0000] transition-colors">
                    {r.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-color pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-[11px] text-text-muted leading-relaxed max-w-2xl">
            Wet3Camp is Kenya's verified escort directory — browse Elite, VIP, Premium and Standard escorts in Nairobi, Mombasa, Kisumu, Nakuru and Eldoret. All profiles are ID-verified. 18+ only. &copy; {year} Wet3Camp.
          </p>
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href="/register" className="text-[11px] font-bold text-[#8B0000] hover:underline">Join Free</Link>
            <span className="text-text-muted">·</span>
            <Link href="/faqs" className="text-[11px] text-text-muted hover:text-text-light">FAQs</Link>
            <span className="text-text-muted">·</span>
            <Link href="/contact" className="text-[11px] text-text-muted hover:text-text-light">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
