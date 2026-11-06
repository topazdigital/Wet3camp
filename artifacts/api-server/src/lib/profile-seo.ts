export interface ProfileSeoInput {
  name?: unknown
  city?: unknown
  area?: unknown
  bio?: unknown
  verified?: unknown
}

function cleanText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;!?])/g, '$1')
    .trim()
}

export function truncateSeoText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  const candidate = value.slice(0, Math.max(1, maxLength - 1))
  const wordBoundary = candidate.lastIndexOf(' ')
  const excerpt = wordBoundary >= Math.floor(maxLength * 0.65)
    ? candidate.slice(0, wordBoundary)
    : candidate
  return `${excerpt.trim().replace(/[.,;:!?–—-]+$/g, '')}…`
}

export function buildProfileSeo(profile: ProfileSeoInput) {
  const name = cleanText(profile.name) || 'Escort profile'
  const city = cleanText(profile.city)
  let area = cleanText(profile.area)
  const isVerified = profile.verified === true || Number(profile.verified) === 1

  if (city && area.toLowerCase() === city.toLowerCase()) area = ''
  if (city && area.toLowerCase().endsWith(`, ${city.toLowerCase()}`)) {
    area = area.slice(0, -(city.length + 2)).trim()
  }

  const location = [area, city].filter(Boolean).join(', ')
  const role = `${isVerified ? 'Verified ' : ''}Escort`
  const titleSuffix = ' | Wet3 Camp'
  const titlePrefix = `${name} — ${role} in ${location || 'Kenya'}`
  const title = `${truncateSeoText(titlePrefix, 60 - titleSuffix.length)}${titleSuffix}`

  const bio = cleanText(profile.bio)
  const descriptionLead = `${isVerified ? 'Verified ' : ''}escort profile for ${name}${location ? ` in ${location}` : ' in Kenya'}.`
  const descriptionDetail = bio
    ? ` ${truncateSeoText(bio, 85)}`
    : ' View profile details and contact directly to confirm current availability.'
  const description = truncateSeoText(`${descriptionLead}${descriptionDetail}`, 155)

  const keywords = [
    name,
    `${name} escort`,
    city && `escort ${city}`,
    area && `escort ${area}`,
    isVerified && city && `verified escort ${city}`,
  ].filter(Boolean).join(', ')

  return { title, description, keywords, area, city, location, isVerified }
}
