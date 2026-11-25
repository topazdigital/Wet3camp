export interface BlogImportArticle {
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  image_url: string
  author: string
  published_at: string
  read_time: number
  seo_title: string
  seo_description: string
  source_url: string | null
}

export interface BlogImportSourceResult {
  id: string
  name: string
  discovered: number
  parsed: number
  error: string
}

export const BLOG_IMPORT_SOURCES: Array<{ id: string; name: string; baseUrl: string; hosts: string[] }>
export const MAX_BLOG_ARTICLES_PER_SOURCE: number

export function parseBlogArticleHtml(
  html: string,
  pageUrl: string,
  source: { id: string; name: string; baseUrl: string; hosts: string[] },
  overrides?: Record<string, any>,
  downloadImage?: (url: string, prefix: string, referer: string, allowedHosts: string[]) => Promise<string | null>,
): Promise<BlogImportArticle | null>

export function importBlogArticlesFromApprovedSources(options?: {
  sourceId?: string
  maxPerSource?: number
  excludeSourceUrls?: string[]
  downloadImage?: (url: string, prefix: string, referer: string, allowedHosts: string[]) => Promise<string | null>
  onSourceComplete?: (result: BlogImportSourceResult & { articles: BlogImportArticle[] }) => Promise<void> | void
}): Promise<BlogImportSourceResult[]>
