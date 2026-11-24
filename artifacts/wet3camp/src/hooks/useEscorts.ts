import { useMemo } from 'react'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { api, type ApiEscort } from '@/lib/api'

const PLACEHOLDER_IMAGE = '/api/placeholder-escort.jpg'
const ESCORTS_PAGE_SIZE = 200

function toAppEscort(e: ApiEscort) {
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
    featured:    (e as any).featured ?? false,
    follower_count: (e as any).follower_count ?? 0,
    views_count: Number((e as any).views_count ?? 0),
    mergedRedirect: (e as any).mergedRedirect ?? false,
    phone:       e.whatsapp,
    whatsapp:    e.whatsapp,
    telegram:    (e as any).telegram ?? null,
  }
}

export function useAllEscorts(params?: { service?: string; sort?: 'featured' | 'newest' }) {
  const svc = params?.service ?? ''
  const sort = params?.sort ?? 'featured'
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery({
    queryKey:  ['escorts', 'all', svc, sort],
    initialPageParam: 0,
    queryFn:   ({ pageParam }) => api.escorts.list({
      limit: ESCORTS_PAGE_SIZE,
      offset: pageParam,
      sort,
      ...(svc ? { service: svc } : {}),
    }),
    getNextPageParam: (lastPage, pages) => {
      const loadedCount = pages.reduce((total, page) => total + page.data.length, 0)
      return loadedCount < lastPage.total ? loadedCount : undefined
    },
    staleTime: 5 * 60 * 1000,
    retry:     1,
  })

  const escorts = useMemo(() => {
    return data?.pages.flatMap(page => page.data.map(toAppEscort)) ?? []
  }, [data])

  // An empty array is still a successful API response. Keep it distinct from
  // the not-yet-loaded state so the grid can render its empty state instead of
  // showing skeleton cards forever on a fresh development database.
  const fromApi = Array.isArray(data?.pages)
  const total   = data?.pages[0]?.total ?? 0

  return {
    escorts,
    total,
    fromApi,
    isLoading: isLoading && !isError,
    fetchNextPage,
    hasNextPage: Boolean(hasNextPage),
    isFetchingNextPage,
    isFetchNextPageError,
  }
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
    if (!slugOrId) return null
    if (isLoading) return null
    return null
  }, [data, slugOrId, isLoading])

  return { escort, isLoading: isLoading && !isError, fromApi: !!data }
}

export { PLACEHOLDER_IMAGE, toAppEscort }
