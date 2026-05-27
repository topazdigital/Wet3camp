const BASE = '/api'
const TOKEN_KEY = 'w3c_token'

export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function setToken(t: string) {
  try { localStorage.setItem(TOKEN_KEY, t) } catch {}
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch {}
}

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const t = getToken()
  if (t) headers['Authorization'] = `Bearer ${t}`
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...headers, ...opts?.headers } })
  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }))
    const err = new Error(body.message ?? res.statusText) as Error & { status: number; code?: string }
    err.status = res.status
    err.code   = body.code
    throw err
  }
  return res.json()
}

export interface ApiEscort {
  id: string; name: string; age: number; city: string; area: string
  lat: number; lng: number; tier: string; rating: number; reviews_count: number
  bio: string; image: string; height: string; body_type: string
  ethnicity: string; hair_color: string
  price_hourly: number; price_overnight: number; price_video: number
  whatsapp: string; telegram: string
  available: boolean; verified: boolean; online: boolean
  languages: string[]
  services?: Array<{ name: string; available: boolean }>
  gallery?: string[]
}

export interface ApiUser {
  id: string; name: string; email: string; role: 'user' | 'escort' | 'admin'
  avatar: string | null; phone: string | null
  approved?: boolean
}

export const api = {
  escorts: {
    list: (p?: { city?: string; tier?: string; available?: string; limit?: number; offset?: number }) => {
      const params = new URLSearchParams()
      if (p?.city)      params.set('city',      p.city)
      if (p?.tier)      params.set('tier',      p.tier)
      if (p?.available) params.set('available', p.available)
      if (p?.limit)     params.set('limit',     String(p.limit))
      if (p?.offset)    params.set('offset',    String(p.offset))
      const qs = params.toString()
      return req<{ data: ApiEscort[]; total: number }>(`/escorts${qs ? '?' + qs : ''}`)
    },
    get: (id: string) => req<ApiEscort>(`/escorts/${id}`),
  },

  auth: {
    login:    (email: string, password: string) =>
      req<{ token: string; user: ApiUser }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (d: {
      name: string; email: string; password: string; phone?: string
      role?: string; city?: string; area?: string
      bio?: string; whatsapp?: string; telegram?: string
      bodyType?: string; ethnicity?: string; height?: string; hairColor?: string
      rateHourly?: number; rateOvernight?: number; rateVideo?: number
      languages?: string[]; services?: string[]
    }) =>
      req<{ token: string; user: ApiUser; escortId?: string }>('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    forgotPassword: (email: string) =>
      req<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    me: () => req<ApiUser>('/auth/me'),
  },

  reviews: {
    list: (escortId?: string) => {
      const qs = escortId ? `?escortId=${escortId}` : ''
      return req<any[]>(`/reviews${qs}`)
    },
    submit: (escortId: string, rating: number, text: string) =>
      req<{ id: number }>('/reviews', { method: 'POST', body: JSON.stringify({ escortId, rating, text }) }),
  },

  messages: {
    list:  ()                                       => req<any[]>('/messages'),
    send:  (escortId: number, content: string)      => req('/messages', { method: 'POST', body: JSON.stringify({ escortId, content }) }),
    markRead: (escortId: number)                    => req('/messages/read', { method: 'POST', body: JSON.stringify({ escortId }) }),
  },

  notifications: {
    list:       ()          => req<any[]>('/notifications'),
    markRead:   (id: string)=> req(`/notifications/${id}/read`,   { method: 'PATCH' }),
    markAllRead:()          => req('/notifications/read-all',      { method: 'PATCH' }),
  },

  bookings: {
    list:   ()                  => req<any[]>('/bookings'),
    create: (d: Record<string, unknown>) => req('/bookings', { method: 'POST', body: JSON.stringify(d) }),
  },

  favorites: {
    list:   ()            => req<string[]>('/favorites'),
    toggle: (id: string)  => req<{ saved: boolean }>(`/favorites/${id}`, { method: 'POST' }),
  },

  profile: {
    get: () => req<ApiUser>('/profile'),
    getEscort: () => req<any>('/profile/escort'),
    update: (d: { name?: string; phone?: string; avatar?: string }) =>
      req<ApiUser>('/profile', { method: 'PATCH', body: JSON.stringify(d) }),
    updateEscort: (d: {
      bio?: string; city?: string; area?: string
      whatsapp?: string; telegram?: string
      bodyType?: string; ethnicity?: string; height?: string; hairColor?: string
      rateHourly?: number; rateOvernight?: number; rateVideo?: number
      available?: boolean; languages?: string[]; services?: string[]
    }) =>
      req<any>('/profile/escort', { method: 'PATCH', body: JSON.stringify(d) }),
  },

  upload: {
    photo: (data: string, type: 'avatar' | 'gallery', filename?: string) =>
      req<{ success: boolean; url: string }>('/upload', {
        method: 'POST',
        body: JSON.stringify({ data, filename, type }),
      }),
    removeGallery: (url: string) =>
      req<{ success: boolean }>('/upload', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
      }),
  },
}
