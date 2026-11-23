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
  assert.equal(isDirectoryProfileUrl(getDirectorySource('kenyaraha'), 'https://www.kenyaraha.com/embed-1/kenyan-escort-from-nairobi-kenya/example/'), false)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('escortamus'), 'https://www.escortamus.com/kenya/nairobi/example/'), true)
  assert.equal(isDirectoryProfileUrl(getDirectorySource('escortamus'), 'https://www.escortamus.com/uganda/kampala/example/'), false)
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
