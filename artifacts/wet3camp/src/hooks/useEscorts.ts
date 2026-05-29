import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ApiEscort } from '@/lib/api'

const PLACEHOLDER_IMAGE = '/api/placeholder-escort.jpg'

export function toAppEscort(e: ApiEscort) {
  return {
    id:          e.id,
    user_id:     (e as any).user_id ?? null,
    name:        e.name,
    age:         e.age,
    city:        e.city,
    area:        e.area,
    lat:         Number(e.lat),
    lng:         Number(e.lng),
    tier:        e.tier as 'elite'|'vip'|'premium'|'standard'|'free',
    rating:      Number(e.rating),
    reviews:     e.reviews_count,
    image:       e.image || null,
    gallery:     e.gallery  ?? [],
    bio:         e.bio,
    services:    e.services ?? [],
    pricing:     {
      hourly:          e.price_hourly,
      overnight:       e.price_overnight,
      video:           e.price_video,
      incall:          (e as any).price_incall          ?? 0,
      outcall:         (e as any).price_outcall         ?? 0,
      incallOvernight: (e as any).price_incall_overnight ?? 0,
      outcallOvernight:(e as any).price_outcall_overnight ?? 0,
    },
    languages:   e.languages ?? [],
    height:      e.height,
    bodyType:    e.body_type,
    ethnicity:   e.ethnicity,
    hairColor:   e.hair_color,
    available:   e.available,
    verified:    e.verified,
    online:      e.online,
    phone:       e.whatsapp,
    whatsapp:    e.whatsapp,
    telegram:    (e as any).telegram ?? null,
  }
}

export function useAllEscorts(params?: { city?: string; tier?: string; limit?: number; sort?: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['escorts', 'all', params],
    queryFn:   () => api.escorts.list({ limit: params?.limit ?? 200, ...params }),
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })

  const escorts = useMemo(() => {
    if (data?.data?.length) return data.data.map(toAppEscort)
    return []
  }, [data])

  const fromApi = !!(data?.data?.length)
  const total   = data?.total ?? 0

  return { escorts, total, fromApi, isLoading: isLoading && !isError, isError }
}

export function useEscort(slugOrId: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['escort', slugOrId],
    queryFn:   () => api.escorts.get(slugOrId!),
    enabled:   !!slugOrId,
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })

  const escort = useMemo(() => {
    if (data) return toAppEscort(data)
    return null
  }, [data])

  return { escort, isLoading: isLoading && !isError, fromApi: !!data }
}

export { PLACEHOLDER_IMAGE }
