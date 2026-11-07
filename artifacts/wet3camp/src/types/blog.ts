export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  publishedAt: string
  updatedAt: string
  imageUrl: string
  readTime: number
  published: boolean
  seoTitle?: string
  seoDescription?: string
}
