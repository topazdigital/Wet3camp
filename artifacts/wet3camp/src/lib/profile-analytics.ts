export type ProfileAnalyticsEventType =
  | 'profile_view'
  | 'whatsapp_click'
  | 'telegram_click'
  | 'call_click'
  | 'sms_click'
  | 'share_click'
  | 'platform_message_click'

const SESSION_STORAGE_KEY = 'w3c_profile_analytics_session'
const DISCOVERY_CONTEXT_KEY = 'w3c_profile_discovery_context'
const EVENT_URL = '/api/profile/escort/analytics/events'
const SEARCH_CONTEXT_TTL_MS = 30 * 60 * 1000

type DiscoveryContext = {
  source: 'search'
  city?: string
  savedAt: number
}

function getSessionKey(): string {
  try {
    const current = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (current && current.length >= 16) return current
    const next = globalThis.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem(SESSION_STORAGE_KEY, next)
    return next
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`
  }
}

export function rememberProfileSearchContext(city: string): void {
  try {
    const context: DiscoveryContext = {
      source: 'search',
      city: city && city !== 'All Cities' ? city : undefined,
      savedAt: Date.now(),
    }
    sessionStorage.setItem(DISCOVERY_CONTEXT_KEY, JSON.stringify(context))
  } catch {
    // Analytics context is optional; profile navigation must keep working.
  }
}

function getDiscoveryContext(): { source: string; cityContext?: string } {
  try {
    const raw = sessionStorage.getItem(DISCOVERY_CONTEXT_KEY)
    if (raw) {
      const context = JSON.parse(raw) as DiscoveryContext
      if (context.source === 'search' && Date.now() - context.savedAt < SEARCH_CONTEXT_TTL_MS) {
        return { source: 'search', cityContext: context.city }
      }
    }
  } catch {
    // Fall through to the browser referrer.
  }

  const referrer = document.referrer
  if (!referrer) return { source: 'direct' }

  try {
    const host = new URL(referrer).hostname.toLowerCase()
    if (host === window.location.hostname.toLowerCase()) return { source: 'site' }
    if (/(^|\.)google\./.test(host) || /(^|\.)bing\./.test(host) || /duckduckgo/.test(host)) {
      return { source: 'google' }
    }
    if (/(facebook|instagram|tiktok|t\.me|telegram|whatsapp|wa\.me)/.test(host)) {
      return { source: 'social' }
    }
    return { source: 'other' }
  } catch {
    return { source: 'other' }
  }
}

export function trackProfileEvent(
  escortId: string | number,
  eventType: ProfileAnalyticsEventType,
): void {
  const id = Number(escortId)
  if (!Number.isSafeInteger(id) || id < 1 || typeof window === 'undefined') return

  const context = getDiscoveryContext()
  const body = JSON.stringify({
    escortId: id,
    eventType,
    sessionKey: getSessionKey(),
    source: context.source,
    cityContext: context.cityContext,
  })

  try {
    const payload = new Blob([body], { type: 'application/json' })
    if (navigator.sendBeacon?.(EVENT_URL, payload)) return
  } catch {
    // Fall back to a keepalive fetch below.
  }

  void fetch(EVENT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {})
}
