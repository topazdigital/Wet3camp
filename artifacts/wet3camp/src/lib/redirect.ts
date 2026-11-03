export function safeInternalRedirect(value: string | null | undefined): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) return null

  try {
    const origin = typeof window === 'undefined' ? 'https://wet3camp.invalid' : window.location.origin
    const url = new URL(value, origin)
    if (
      url.origin !== origin ||
      ['/login', '/register', '/auth/callback', '/auth/choose-role'].includes(url.pathname) ||
      url.pathname.startsWith('/api/')
    ) return null
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return null
  }
}
