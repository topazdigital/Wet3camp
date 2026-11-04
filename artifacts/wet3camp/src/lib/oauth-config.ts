import { useEffect, useState } from 'react'

export type OAuthProvider = 'google' | 'facebook' | 'apple'

export interface OAuthConfig {
  googleClientId: string | null
  providers: Record<OAuthProvider, boolean>
}

const EMPTY_OAUTH_CONFIG: OAuthConfig = {
  googleClientId: null,
  providers: { google: false, facebook: false, apple: false },
}

export function useOAuthConfig(): OAuthConfig {
  const [config, setConfig] = useState(EMPTY_OAUTH_CONFIG)

  useEffect(() => {
    let cancelled = false

    fetch('/api/auth/oauth-config', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then((data: Partial<OAuthConfig> | null) => {
        if (cancelled || !data?.providers) return
        setConfig({
          googleClientId: typeof data.googleClientId === 'string' ? data.googleClientId : null,
          providers: {
            google: data.providers.google === true,
            facebook: data.providers.facebook === true,
            apple: data.providers.apple === true,
          },
        })
      })
      .catch(() => {
        if (!cancelled) setConfig(EMPTY_OAUTH_CONFIG)
      })

    return () => { cancelled = true }
  }, [])

  return config
}
