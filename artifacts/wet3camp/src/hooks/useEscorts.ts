import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ApiEscort } from '@/lib/api'
import { ESCORTS, getSlug } from '@/data/escorts'

const FALLBACK_PHOTOS = [
  'photo-1531123897727-8f129e1688ce',
  'photo-1522529599102-193c0d76b5b6',
  'photo-1509868918748-a554bf5f7e09',
  'photo-1531123414780-f74242c2b052',
  'photo-1583195764036-798f1052af7e',
  'photo-1488716820095-cbe80883c496',
]
function fallbackImage(id: string) {
  const idx = parseInt(id.replace(/\D/g, '') || '0') % FALLBACK_PHOTOS.length
  return `https://images.unsplash.com/${FALLBACK_PHOTOS[idx]}?w=600&h=800&fit=crop&crop=face`
}

function toAppEscort(e: ApiEscort) {
  return {
    id:        e.id,
    name:      e.name,
    age:       e.age,
    city:      e.city,
    area:      e.area,
    lat:       Number(e.lat),
    lng:       Number(e.lng),
    tier:      e.tier as 'elite'|'vip'|'premium'|'standard'|'free',
    rating:    Number(e.rating),
    reviews:   e.reviews_count,
    image:     e.image || fallbackImage(e.id),
    gallery:   e.gallery  ?? [],
    bio:       e.bio,
    services:  e.services ?? [],
    pricing:   { hourly: e.price_hourly, overnight: e.price_overnight, video: e.price_video },
    languages: e.languages ?? [],
    height:    e.height,
    bodyType:  e.body_type,
    ethnicity: e.ethnicity,
    hairColor: e.hair_color,
    available: e.available,
    verified:  e.verified,
    online:    e.online,
    phone:     e.whatsapp,
  }
}

export function useAllEscorts() {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['escorts', 'all'],
    queryFn:   () => api.escorts.list({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })

  const escorts = useMemo(() => {
    if (data?.data?.length) return data.data.map(toAppEscort)
    return ESCORTS
  }, [data])

  const fromApi = !!(data?.data?.length)
  const total   = data?.total ?? ESCORTS.length

  return { escorts, total, fromApi, isLoading: isLoading && !isError }
}

export function useEscort(slugOrId: string | undefined) {
  const numericId = slugOrId && /^\d+$/.test(slugOrId) ? slugOrId : undefined

  const { data, isLoading, isError } = useQuery({
    queryKey:  ['escort', numericId],
    queryFn:   () => api.escorts.get(numericId!),
    enabled:   !!numericId,
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })

  const escort = useMemo(() => {
    if (data) return toAppEscort(data)
    if (!slugOrId) return null
    return (
      ESCORTS.find(e => getSlug(e.name) === slugOrId) ??
      ESCORTS.find(e => e.id === slugOrId) ??
      null
    )
  }, [data, slugOrId])

  return { escort, isLoading: isLoading && !isError, fromApi: !!data }
}
