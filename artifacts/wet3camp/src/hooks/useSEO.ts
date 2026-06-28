import { useEffect } from 'react'

interface SEOOptions {
  title?: string
  description?: string
}

export function useSEO({ title, description }: SEOOptions) {
  useEffect(() => {
    if (title) document.title = title
    if (description) {
      let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }
  }, [title, description])
}
