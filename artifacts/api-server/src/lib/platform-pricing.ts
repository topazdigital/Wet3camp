export interface PlatformPricing {
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

export const DEFAULT_PLATFORM_PRICING: PlatformPricing = {
  profileTiers: {
    premium: 2200,
    vip: 4500,
    elite: 8500,
  },
  featured: {
    threeDay: 500,
    weekly: 1500,
    monthly: 4500,
  },
}

export const PLATFORM_PRICING_SETTING_KEY = 'advertised_pricing'

export function isValidPlatformPricing(value: unknown): value is PlatformPricing {
  if (!value || typeof value !== 'object') return false
  const pricing = value as Partial<PlatformPricing>
  const amounts = [
    pricing.profileTiers?.premium,
    pricing.profileTiers?.vip,
    pricing.profileTiers?.elite,
    pricing.featured?.threeDay,
    pricing.featured?.weekly,
    pricing.featured?.monthly,
  ]
  return amounts.every(amount =>
    typeof amount === 'number' && Number.isSafeInteger(amount) && amount > 0
  )
}

export async function readPlatformPricing(pool: any): Promise<PlatformPricing> {
  const [rows] = await pool.query<any[]>(
    'SELECT `value` FROM platform_settings WHERE `key` = ?',
    [PLATFORM_PRICING_SETTING_KEY],
  )
  const row = Array.isArray(rows) ? rows[0] : undefined
  if (!row) return DEFAULT_PLATFORM_PRICING

  let saved: unknown
  try {
    saved = JSON.parse(String(row.value))
  } catch {
    throw new Error('Saved advertised pricing is not valid JSON')
  }
  if (!isValidPlatformPricing(saved)) {
    throw new Error('Saved advertised pricing has invalid values')
  }
  return saved
}

export function platformPricingSettings(pricing: PlatformPricing): Array<[string, string]> {
  return [[PLATFORM_PRICING_SETTING_KEY, JSON.stringify(pricing)]]
}

export function featuredPriceForPaymentType(type: string, pricing: PlatformPricing): number | null {
  switch (type) {
    case 'featured_basic': return pricing.featured.threeDay
    case 'featured_weekly': return pricing.featured.weekly
    case 'featured_monthly': return pricing.featured.monthly
    default: return null
  }
}
