import test from 'node:test'
import assert from 'node:assert/strict'
import { BLOG_IMPORT_SOURCES, parseBlogArticleHtml } from './src/lib/blog-source-importer.mjs'

const source = {
  id: 'raha-ke',
  name: 'Raha Kenya',
  baseUrl: 'https://raha.ke',
  hosts: ['raha.ke', 'www.raha.ke'],
}

test('blog discovery uses only NairobiRaha and the ten approved directories', () => {
  assert.deepEqual(
    BLOG_IMPORT_SOURCES.map((entry) => entry.id),
    ['nairobiraha', 'rahaescorts', 'raha-ke', 'toplesskenya', 'nairobihot', 'kenyaraha', 'escortamus', 'rahaanairobi', 'mahabakenya', 'lovebiteglobal', 'ladys-one']
  )
})

test('blog article extraction keeps title, body, category and inline gallery images', async () => {
  const downloaded = []
  const article = await parseBlogArticleHtml(`
    <html><head>
      <meta name="description" content="A useful article summary for readers.">
      <meta property="article:section" content="Travel Guides">
      <meta property="og:image" content="/uploads/cover.jpg">
    </head><body>
      <article>
        <h1>Visiting Mombasa</h1>
        <p>${'This article explains useful local travel information for visitors. '.repeat(4)}</p>
        <h2>What to expect</h2>
        <p>${'Plan ahead and check local details before you travel. '.repeat(3)}</p>
        <p>Example text: &lt;strong&gt;must remain plain text.</p>
        <figure><img src="/uploads/gallery-one.jpg" alt="Coastal view"></figure>
      </article>
    </body></html>
  `, 'https://raha.ke/blog/visiting-mombasa/', source, {}, async (url) => {
    downloaded.push(url)
    return `/api/uploads/${url.split('/').pop()}`
  })

  assert.ok(article)
  assert.equal(article.title, 'Visiting Mombasa')
  assert.equal(article.category, 'Travel Guides')
  assert.match(article.excerpt, /useful article summary/)
  assert.match(article.content, /## What to expect/)
  assert.match(article.content, /!\[Coastal view\]\(\/api\/uploads\/gallery-one.jpg\)/)
  assert.match(article.content, /&lt;strong&gt;must remain plain text/)
  assert.equal(article.image_url, '/api/uploads/cover.jpg')
  assert.equal(downloaded.length, 2)
  assert.equal(article.source_url, 'https://raha.ke/blog/visiting-mombasa/')
})

test('blog article extraction skips pages without enough article body text', async () => {
  const article = await parseBlogArticleHtml(
    '<article><h1>Short page</h1><p>Not enough body text.</p></article>',
    'https://raha.ke/blog/short-page/',
    source,
  )
  assert.equal(article, null)
})

test('blog extraction uses the article body instead of site filters and keeps categories', async () => {
  const article = await parseBlogArticleHtml(`
    <html><head><title>A real travel guide</title></head><body>
      <div class="escort-quick-filter"><h2>Filter escorts</h2><p>Search location and services.</p></div>
      <div class="post-categories"><a>Safety Tips</a></div>
      <div class="bodybox"><div class="entry">
        <h1>A real travel guide</h1>
        <p>${'This is the real article body, with useful information for visitors. '.repeat(5)}</p>
      </div></div>
    </body></html>
  `, 'https://raha.ke/blog/travel-guide/', source)

  assert.ok(article)
  assert.equal(article.category, 'Safety Tips')
  assert.doesNotMatch(article.content, /Filter escorts/)
  assert.match(article.content, /real article body/)
})
