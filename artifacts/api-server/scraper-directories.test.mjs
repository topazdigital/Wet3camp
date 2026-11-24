import test from 'node:test'
import assert from 'node:assert/strict'
import {
  extractSitemapEntries,
  DIRECTORY_SOURCES,
  getDirectorySource,
  isSourceSelected,
  isDirectoryProfileUrl,
  normalizeDirectoryUrl,
  parseRobotsRules,
  robotsPathAllowed,
} from './scraper-directories.mjs'
import {
  extractDirectoryBio,
  extractDirectoryProfileImages,
  extractDirectoryProfileImageCandidates,
  isArchiveLikeDirectoryName,
  isDirectoryBrandOrPlaceholderImage,
} from './scraper-directory-fields.mjs'

test('the recurring directory set contains exactly the ten approved sources', () => {
  assert.deepEqual(
    DIRECTORY_SOURCES.map((source) => source.id),
    ['rahaescorts', 'raha-ke', 'toplesskenya', 'nairobihot', 'kenyaraha', 'escortamus', 'rahaanairobi', 'mahabakenya', 'lovebiteglobal', 'ladys-one']
  )
  assert.ok(DIRECTORY_SOURCES.every((source) => source.maxProfilesPerRun === 200))
})

test('the recurring approved set excludes unapproved legacy hookup254', () => {
  assert.equal(isSourceSelected('nairobiraha', 'approved'), true)
  assert.equal(isSourceSelected('raha-ke', 'approved'), true)
  assert.equal(isSourceSelected('hookup254', 'approved'), false)
  assert.equal(isSourceSelected('hookup254', 'all'), true)
  assert.equal(isSourceSelected('raha-ke', 'raha.ke'), true)
})

test('directory lookup accepts IDs and registered host aliases', () => {
  assert.equal(getDirectorySource('raha-ke')?.id, 'raha-ke')
  assert.equal(getDirectorySource('www.raha.ke')?.id, 'raha-ke')
  assert.equal(getDirectorySource('unapproved.example'), null)
})

test('directory URLs stay on the approved source host and use HTTPS', () => {
  const source = getDirectorySource('raha-ke')
  assert.equal(
    normalizeDirectoryUrl(source, 'http://www.raha.ke/escort/example/?ref=home#bio'),
    'https://raha.ke/escort/example/'
  )
  assert.equal(normalizeDirectoryUrl(source, 'https://example.com/escort/example/'), null)
  assert.equal(normalizeDirectoryUrl(source, 'javascript:alert(1)'), null)
})

test('profile URL checks reject archives and unrelated locations', () => {
  assert.equal(isDirectoryProfileUrl(getDirectorySource('toplesskenya'), 'https://toplesskenya.com/escort/example/'), true)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('toplesskenya'), 'https://toplesskenya.com/escorts/nairobi/'), false)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('kenyaraha'), 'https://www.kenyaraha.com/kenyan-escort-from-nairobi-kenya/example/'), true)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('kenyaraha'), 'https://www.kenyaraha.com/kenyan-escort-from-nairobi-kenya/woodley-archives/'), false)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('kenyaraha'), 'https://www.kenyaraha.com/embed-1/kenyan-escort-from-nairobi-kenya/example/'), false)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('escortamus'), 'https://www.escortamus.com/kenya/nairobi/example/'), true)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('escortamus'), 'https://www.escortamus.com/uganda/kampala/example/'), false)
})

test('archive and category labels are not treated as profile names', () => {
  assert.equal(isArchiveLikeDirectoryName('Woodley Archives'), true)
  assert.equal(isArchiveLikeDirectoryName('Safari Park Archives'), true)
  assert.equal(isArchiveLikeDirectoryName('Nairobi escort profile'), false)
})

test('directory photo extraction prioritizes profile images over generic metadata', () => {
  const images = extractDirectoryProfileImages(`
    <meta property="og:image" content="/wp-content/uploads/profile-main.jpg?size=large&amp;v=1">
    <img class="site-logo" src="/wp-content/uploads/site-logo.png">
    <img class="profile-gallery" data-lazy-src="/wp-content/uploads/profile-second.webp" width="480" height="640">
    <img src="/wp-content/uploads/tiny.jpg" width="24" height="24">
  `, 'https://raha.ke/escort/example/')
  assert.deepEqual(images, [
    'https://raha.ke/wp-content/uploads/profile-second.webp',
    'https://raha.ke/wp-content/uploads/profile-main.jpg?size=large&v=1',
  ])
})

test('directory photo extraction rejects social icons and keeps generic previews low confidence', () => {
  const candidates = extractDirectoryProfileImageCandidates(`
    <meta property="og:image" content="/wp-content/uploads/shared-cover.jpg">
    <img class="gallery-photo" src="/wp-content/uploads/profile-photo.jpg" width="500" height="700">
    <img alt="WhatsApp contact" src="/wp-content/uploads/whatsapp-contact.png" width="400" height="400">
    <img class="social-icon" src="/wp-content/uploads/chat.png" width="400" height="400">
  `, 'https://rahaescorts.com/escort/example/')

  assert.equal(candidates[0].url, 'https://rahaescorts.com/wp-content/uploads/profile-photo.jpg')
  assert.equal(candidates[0].score, 100)
  assert.equal(candidates.some((candidate) => /whatsapp|chat\.png/i.test(candidate.url)), false)
  assert.equal(candidates.find((candidate) => candidate.url.endsWith('/shared-cover.jpg'))?.score, 58)
  assert.equal(isDirectoryBrandOrPlaceholderImage('/uploads/default-avatar.png'), true)
  assert.equal(isDirectoryBrandOrPlaceholderImage('/uploads/telegram-icon.png'), true)
  assert.equal(isDirectoryBrandOrPlaceholderImage('/uploads/model-portrait.jpg'), false)
})

test('directory photo extraction reads JSON-LD and skips placeholders', () => {
  const images = extractDirectoryProfileImages(`
    <script type="application/ld+json">{"@type":"Person","image":["https://cdn.example.test/p1.jpg","https://cdn.example.test/no-image.png"]}</script>
    <img alt="default avatar" src="/images/default-avatar.jpg">
  `, 'https://raha.ke/escort/example/')
  assert.deepEqual(images, ['https://cdn.example.test/p1.jpg'])
})

test('directory bio extraction prefers a usable description', () => {
  const bio = extractDirectoryBio(`
    <meta name="description" content="A profile description with details about availability and services in Nairobi.">
    <div class="site-description">Browse escorts and profiles from Kenya.</div>
  `)
  assert.equal(bio, 'A profile description with details about availability and services in Nairobi.')
})

test('robots rules honor the most-specific allow or disallow rule', () => {
  const { rules } = parseRobotsRules(`
    User-agent: *
    Disallow: /private
    Disallow: /wp-admin/
    Allow: /wp-admin/admin-ajax.php
    Disallow: /*?preview=*
  `)
  assert.equal(robotsPathAllowed('/private/profile', rules), false)
  assert.equal(robotsPathAllowed('/wp-admin/admin-ajax.php', rules), true)
  assert.equal(robotsPathAllowed('/wp-admin/edit.php', rules), false)
  assert.equal(robotsPathAllowed('/escort/example/?preview=1', rules), false)
  assert.equal(robotsPathAllowed('/escort/example/', rules), true)
})

test('robots rules prefer a crawler-specific group over the wildcard group', () => {
  const { rules } = parseRobotsRules(`
    User-agent: *
    Disallow: /

    User-agent: Wet3CampImporter
    Allow: /public/
  `)
  assert.equal(robotsPathAllowed('/public/profile', rules), true)
  assert.equal(robotsPathAllowed('/private/profile', rules), true)
})

test('sitemap entries retain last-modified dates for newest-first ordering', () => {
  assert.deepEqual(
    extractSitemapEntries(`
      <urlset>
        <url><loc>https://raha.ke/escort/new&amp;x=1</loc><lastmod>2026-11-01</lastmod></url>
        <url><loc>https://raha.ke/escort/old</loc></url>
      </urlset>
    `),
    [
      { url: 'https://raha.ke/escort/new&x=1', lastmod: '2026-11-01' },
      { url: 'https://raha.ke/escort/old', lastmod: '' },
    ]
  )
})
