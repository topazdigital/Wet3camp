import { getPool } from './db.js'
import { AREA_LANDING_PAGES, CITY_AREA_VALUES, isAreaRowMatch } from './location-data.js'

export const MIN_INDEXABLE_LOCATION_PROFILES = 2

export interface LocationSourcePair {
  city: string
  area: string
}

export interface PublicLocationArea {
  citySlug: string
  cityName: string
  slug: string
  name: string
  filterArea: string
  sourceCity: string
  sourceArea: string
  profileCount: number
  indexable: boolean
  sourcePairs: LocationSourcePair[]
}

export interface PublicLocationCity {
  name: string
  slug: string
  sourceCity: string
  profileCount: number
  indexable: boolean
  areas: PublicLocationArea[]
  sourcePairs: LocationSourcePair[]
}

const CITY_NAMES: Record<string, string> = {
  nairobi: 'Nairobi',
  mombasa: 'Mombasa',
  kisumu: 'Kisumu',
  nakuru: 'Nakuru',
  eldoret: 'Eldoret',
}

const normalize = (value: unknown) =>
  String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ')

export function locationSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const CITY_ALIAS_TO_SLUG = new Map<string, string>()
for (const [slug, aliases] of Object.entries(CITY_AREA_VALUES)) {
  CITY_ALIAS_TO_SLUG.set(normalize(slug), slug)
  for (const alias of aliases) CITY_ALIAS_TO_SLUG.set(normalize(alias), slug)
}

function addSourcePair(target: LocationSourcePair[], pair: LocationSourcePair) {
  const key = `${normalize(pair.city)}\u0000${normalize(pair.area)}`
  if (!target.some(item => `${normalize(item.city)}\u0000${normalize(item.area)}` === key)) {
    target.push(pair)
  }
}

/**
 * Builds crawlable location pages from active profiles managed by an account.
 * Profiles without an owner are excluded so imported/unclaimed records cannot
 * create new indexable location pages.
 */
export async function getPublicLocationDirectory(): Promise<PublicLocationCity[]> {
  const pool = getPool()
  if (!pool) throw new Error('Location directory requires a database connection')

  const [rows] = await pool.query<any[]>(
    `SELECT MIN(TRIM(city)) AS city,
            MIN(NULLIF(TRIM(area), '')) AS area,
            COUNT(*) AS profile_count
     FROM escorts
     WHERE is_active = 1
       AND user_id IS NOT NULL
       AND city IS NOT NULL
       AND TRIM(city) <> ''
     GROUP BY LOWER(TRIM(city)), LOWER(TRIM(COALESCE(area, '')))
     ORDER BY MIN(TRIM(city)), MIN(NULLIF(TRIM(area), ''))
     LIMIT 10000`
  )

  const cities = new Map<string, PublicLocationCity>()

  for (const row of rows as any[]) {
    const sourceCity = String(row.city ?? '').trim()
    const sourceArea = String(row.area ?? '').trim()
    if (!sourceCity) continue

    const aliasSlug = CITY_ALIAS_TO_SLUG.get(normalize(sourceCity))
    const citySlug = aliasSlug ?? locationSlug(sourceCity)
    if (!citySlug) continue
    const cityName = aliasSlug ? CITY_NAMES[aliasSlug] : sourceCity
    const sourcePair = { city: sourceCity, area: sourceArea }
    const count = Number(row.profile_count ?? 0)

    let city = cities.get(citySlug)
    if (!city) {
      city = {
        name: cityName,
        slug: citySlug,
        sourceCity,
        profileCount: 0,
        indexable: false,
        areas: [],
        sourcePairs: [],
      }
      cities.set(citySlug, city)
    }

    city.profileCount += count
    addSourcePair(city.sourcePairs, sourcePair)

    let areaName = sourceArea
    let staticArea = undefined as typeof AREA_LANDING_PAGES[number] | undefined
    if (!areaName && aliasSlug && normalize(sourceCity) !== normalize(cityName)) {
      staticArea = AREA_LANDING_PAGES.find(page =>
        page.citySlug === citySlug && isAreaRowMatch(page, { city: sourceCity, area: '' })
      )
      areaName = staticArea?.name ?? sourceCity
    }
    if (!areaName) continue

    staticArea ??= AREA_LANDING_PAGES.find(page =>
      page.citySlug === citySlug &&
      (locationSlug(page.name) === locationSlug(areaName) ||
        isAreaRowMatch(page, { city: sourceCity, area: sourceArea }))
    )
    const slug = staticArea?.slug ?? locationSlug(areaName)
    if (!slug) continue

    let area = city.areas.find(item => item.slug === slug)
    if (!area) {
      area = {
        citySlug,
        cityName,
        slug,
        name: staticArea?.name ?? areaName,
        filterArea: sourceArea || staticArea?.filterValues[0] || areaName,
        sourceCity,
        sourceArea,
        profileCount: 0,
        indexable: false,
        sourcePairs: [],
      }
      city.areas.push(area)
    }
    area.profileCount += count
    addSourcePair(area.sourcePairs, sourcePair)
  }

  return [...cities.values()]
    .map(city => ({
      ...city,
      indexable: city.profileCount >= MIN_INDEXABLE_LOCATION_PROFILES,
      areas: city.areas
        .map(area => ({
          ...area,
          indexable: area.profileCount >= MIN_INDEXABLE_LOCATION_PROFILES,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function getPublicLocationProfiles(
  sourcePairs: LocationSourcePair[],
  limit = 24,
): Promise<Array<{ id: number | string; name: string; city?: string; area?: string }>> {
  const pool = getPool()
  if (!pool) throw new Error('Location profiles require a database connection')
  if (!sourcePairs.length) return []

  const uniquePairs: LocationSourcePair[] = []
  for (const pair of sourcePairs) addSourcePair(uniquePairs, pair)
  const conditions = uniquePairs.map(() =>
    `(LOWER(TRIM(e.city)) = LOWER(TRIM(?)) AND LOWER(TRIM(COALESCE(e.area, ''))) = LOWER(TRIM(?)))`
  )
  const params = uniquePairs.flatMap(pair => [pair.city, pair.area])
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit) || 24, 100))
  const [rows] = await pool.query<any[]>(
    `SELECT e.id, e.name, e.city, e.area
     FROM escorts e
     WHERE e.is_active = 1
       AND e.user_id IS NOT NULL
       AND (${conditions.join(' OR ')})
     ORDER BY e.featured DESC, e.rating DESC, e.id DESC
     LIMIT ?`,
    [...params, safeLimit],
  )
  return rows as Array<{ id: number | string; name: string; city?: string; area?: string }>
}
