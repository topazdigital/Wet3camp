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
    register: (d: { name: string; email: string; password: string; phone?: string }) =>
      req<{ token: string; user: ApiUser }>('/auth/register', { method: 'POST', body: JSON.stringify(d) }),
    forgotPassword: (email: string) =>
      req<{ message: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    me: () => req<ApiUser>('/auth/me'),
  },

  messages: {
    list:  ()                                     => req<any[]>('/messages'),
    send:  (escortId: number, content: string)    => req('/messages',  { method: 'POST', body: JSON.stringify({ escortId, content }) }),
  },

  bookings: {
    list:   ()                  => req<any[]>('/bookings'),
    create: (d: Record<string, unknown>) => req('/bookings', { method: 'POST', body: JSON.stringify(d) }),
  },

  favorites: {
    list:   ()            => req<string[]>('/favorites'),
    toggle: (id: string)  => req<{ saved: boolean }>(`/favorites/${id}`, { method: 'POST' }),
  },
}
