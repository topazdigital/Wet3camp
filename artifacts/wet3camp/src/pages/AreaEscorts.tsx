import { useEffect, useState } from 'react'
import { Link, useRoute } from 'wouter'
import { ChevronRight, MapPin, Shield, Users } from 'lucide-react'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import SeoFooter from '@/components/SeoFooter'
import { useSEO } from '@/lib/useSEO'
import { api, type ApiEscort } from '@/lib/api'
import { proxyImg } from '@/lib/proxyImg'
import { getSlug } from '@/data/escorts'
import { areaSlug, getAreaPage } from '@/data/area-pages'

function ProfileCard({ escort }: { escort: ApiEscort }) {
  return (
    <Link
      href={`/@${getSlug(escort.name)}`}
      data-testid={`link-area-profile-${escort.id}`}
      className="group block overflow-hidden rounded-xl border border-color bg-card-bg transition-all hover:border-[#8B0000]/60"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        {escort.image ? (
          <img
            src={proxyImg(escort.image)}
            alt={`${escort.name} profile in ${escort.area || escort.city}`}
            width="300"
            height="400"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={event => { event.currentTarget.src = '/api/placeholder-escort.jpg' }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#351313]">
            <span className="text-5xl font-black text-[#8B0000]/60">{escort.name.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-10">
          <p className="truncate text-sm font-black text-white">{escort.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/70">
            <MapPin size={10} /> {escort.area || escort.city}
          </p>
        </div>
        {escort.verified && (
          <span className="absolute right-2 top-2 rounded-full bg-green-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
            ✓ Verified
          </span>
        )}
      </div>
    </Link>
  )
}

export default function AreaEscorts() {
  const [, params] = useRoute('/escorts/:city/:area')
  const cityKey = (params?.city ?? '').toLowerCase()
  const areaKey = (params?.area ?? '').toLowerCase()
  const area = getAreaPage(cityKey, areaKey)
  const [escorts, setEscorts] = useState<ApiEscort[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  useSEO({
    title: area ? `Escorts in ${area.name}, ${area.cityName}` : 'Location Not Found',
    description: area?.description ?? 'This location page could not be found.',
    keywords: area
      ? `${area.name} escorts, escorts in ${area.name}, verified escorts ${area.name}, ${area.cityName} escorts, escort directory ${area.name}`
      : undefined,
    city: area?.cityName,
    canonicalPath: area ? `/escorts/${area.citySlug}/${area.slug}` : `/escorts/${cityKey}/${areaKey}`,
    noIndex: !area || (!loading && escorts.length === 0),
    type: 'place',
  })

  useEffect(() => {
    if (!area) {
      setLoading(false)
      return
    }
    setLoading(true)
    api.escorts.list({ city: area.cityName, area: area.filterArea, limit: 24, sort: 'featured' })
      .then(response => {
        setEscorts(response.data ?? [])
        setTotal(response.total ?? response.data?.length ?? 0)
      })
      .catch(() => {
        setEscorts([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [area])

  if (!area) {
    return (
      <div className="flex min-h-screen bg-dark-bg">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Header />
          <main className="mx-auto max-w-3xl px-4 py-20 text-center">
            <h1 className="text-2xl font-black text-text-light">Location not found</h1>
            <p className="mt-2 text-sm text-text-muted">This area landing page is not available.</p>
            <Link href="/search" data-testid="link-area-not-found-search" className="mt-6 inline-flex rounded-xl bg-[#8B0000] px-5 py-2.5 text-sm font-bold text-white">
              Browse all locations
            </Link>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-dark-bg lg:flex-row">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <Header />
        <main>
          <div className="border-b border-color bg-gradient-to-br from-[#260808] via-dark-bg to-dark-bg">
            <div className="mx-auto max-w-5xl px-4 py-8">
              <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs text-text-muted">
                <Link href="/" data-testid="link-area-breadcrumb-home" className="hover:text-text-light">Home</Link>
                <ChevronRight size={11} />
                <Link href={`/escorts/${area.citySlug}`} data-testid="link-area-breadcrumb-city" className="hover:text-text-light">{area.cityName}</Link>
                <ChevronRight size={11} />
                <span className="text-text-light">{area.name}</span>
              </nav>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#d89191]">
                <MapPin size={13} /> {area.cityName}, Kenya
              </p>
              <h1 data-testid="heading-area-title" className="text-3xl font-black text-text-light sm:text-4xl">
                Escorts in {area.name}, {area.cityName}
              </h1>
              <p data-testid="text-area-description" className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
                {area.description}
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-4 py-8">
            <section aria-labelledby="area-intro-heading" className="mb-8 rounded-2xl border border-color bg-card-bg p-5">
              <h2 id="area-intro-heading" className="mb-3 text-lg font-black text-text-light">
                About {area.name}
              </h2>
              <p className="text-sm leading-7 text-text-muted">{area.intro}</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="flex items-center gap-2 text-xs text-text-muted"><Shield size={15} className="text-green-400" /> Public profile details</div>
                <div className="flex items-center gap-2 text-xs text-text-muted"><MapPin size={15} className="text-[#d89191]" /> Area-specific results</div>
                <div className="flex items-center gap-2 text-xs text-text-muted"><Users size={15} className="text-[#d89191]" /> Direct contact options</div>
              </div>
            </section>

            <section aria-labelledby="area-profiles-heading" className="mb-10">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <h2 id="area-profiles-heading" className="text-xl font-black text-text-light">
                    Profiles in {area.name}
                  </h2>
                  <p data-testid="text-area-profile-count" className="mt-1 text-xs text-text-muted">
                    {loading ? 'Loading current profiles…' : `${total} active profile${total === 1 ? '' : 's'} listing this area`}
                  </p>
                </div>
                <Link href={`/search?city=${encodeURIComponent(area.cityName)}&area=${encodeURIComponent(area.filterArea)}`} data-testid="link-area-search" className="hidden rounded-lg border border-[#8B0000]/60 px-3 py-2 text-xs font-bold text-[#d89191] hover:bg-[#8B0000]/10 sm:inline-flex">
                  Open filters
                </Link>
              </div>
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-xl bg-card-bg" />)}
                </div>
              ) : escorts.length > 0 ? (
                <div data-testid="grid-area-profiles" className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {escorts.map(escort => <ProfileCard key={escort.id} escort={escort} />)}
                </div>
              ) : (
                <div data-testid="status-area-empty" className="rounded-2xl border border-dashed border-color px-5 py-12 text-center">
                  <p className="text-sm text-text-muted">No active profiles currently list {area.name}.</p>
                  <Link href={`/escorts/${area.citySlug}`} data-testid="link-area-empty-city" className="mt-4 inline-flex rounded-xl bg-[#8B0000] px-5 py-2.5 text-sm font-bold text-white">
                    See all {area.cityName} profiles
                  </Link>
                </div>
              )}
            </section>

            <section aria-labelledby="nearby-areas-heading" className="mb-8">
              <h2 id="nearby-areas-heading" className="mb-3 text-lg font-black text-text-light">
                Nearby areas in {area.cityName}
              </h2>
              <div className="flex flex-wrap gap-2">
                {area.nearby.map(nearby => (
                  <Link
                    key={nearby}
                    href={`/escorts/${area.citySlug}/${areaSlug(nearby)}`}
                    data-testid={`link-nearby-area-${areaSlug(nearby)}`}
                    className="rounded-full border border-color bg-card-bg px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-[#8B0000]/60 hover:text-text-light"
                  >
                    {nearby} escorts
                  </Link>
                ))}
              </div>
            </section>

            <div className="rounded-2xl border border-[#8B0000]/30 bg-gradient-to-br from-[#8B0000]/15 to-transparent p-6 text-center">
              <h2 className="text-base font-black text-text-light">Looking across {area.cityName}?</h2>
              <p className="mt-1 text-xs text-text-muted">Browse the full city directory or compare another nearby area.</p>
              <Link href={`/escorts/${area.citySlug}`} data-testid="link-area-city-directory" className="mt-4 inline-flex rounded-xl bg-[#8B0000] px-5 py-2.5 text-sm font-black text-white">
                View {area.cityName} directory
              </Link>
            </div>
          </div>
        </main>
        <SeoFooter />
      </div>
    </div>
  )
}