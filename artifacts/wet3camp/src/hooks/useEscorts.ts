import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api, type ApiEscort } from '@/lib/api'
import { ESCORTS } from '@/data/escorts'

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
    image:     e.image,
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

export function useEscort(id: string | undefined) {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['escort', id],
    queryFn:   () => api.escorts.get(id!),
    enabled:   !!id,
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })

  const escort = useMemo(() => {
    if (data) return toAppEscort(data)
    return id ? ESCORTS.find(e => e.id === id) ?? null : null
  }, [data, id])

  return { escort, isLoading: isLoading && !isError, fromApi: !!data }
}
