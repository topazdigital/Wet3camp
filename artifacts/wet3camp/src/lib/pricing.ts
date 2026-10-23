import { useCallback, useEffect, useRef, useState } from 'react'

export interface PublicPricing {
  profileTiers: {
    premium: number
    vip: number
    elite: number
  }
  featured: {
    threeDay: number
    weekly: number
    monthly: number
  }
}

function isPublicPricing(value: unknown): value is PublicPricing {
  if (!value || typeof value !== 'object') return false
  const pricing = value as Partial<PublicPricing>
  return [
    pricing.profileTiers?.premium,
    pricing.profileTiers?.vip,
    pricing.profileTiers?.elite,
    pricing.featured?.threeDay,
    pricing.featured?.weekly,
    pricing.featured?.monthly,
  ].every(amount => typeof amount === 'number' && Number.isSafeInteger(amount) && amount > 0)
}

export async function fetchPublicPricing(): Promise<PublicPricing> {
  const response = await fetch('/api/public/pricing', { cache: 'no-store' })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.message || 'Current prices are temporarily unavailable.')
  }
  if (!isPublicPricing(payload.pricing)) {
    throw new Error('The current price information could not be read.')
  }
  return payload.pricing
}

export function usePublicPricing() {
  const [pricing, setPricing] = useState<PublicPricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const inFlight = useRef<Promise<PublicPricing | null> | null>(null)

  const refresh = useCallback((): Promise<PublicPricing | null> => {
    if (inFlight.current) return inFlight.current

    const request = fetchPublicPricing()
      .then(nextPricing => {
        setPricing(nextPricing)
        setError('')
        return nextPricing
      })
      .catch((reason: unknown) => {
        setPricing(null)
        setError(reason instanceof Error ? reason.message : 'Current prices are temporarily unavailable.')
        return null
      })
      .finally(() => {
        inFlight.current = null
        setLoading(false)
      })

    inFlight.current = request
    return request
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 60_000)
    window.addEventListener('focus', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  return { pricing, loading, error, refresh }
}

export function formatKes(amount: number): string {
  return `KES ${new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 }).format(amount)}`
}
