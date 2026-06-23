import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api, setToken, clearToken, getToken, type ApiUser } from './api'

export type UserRole = 'client' | 'escort' | 'admin'

export interface AuthUser {
  id: string; name: string; email: string; role: UserRole
  city?: string; area?: string; lat?: number; lng?: number
  avatar?: string; profileId?: string; phone?: string
  approved?: boolean
}

interface AuthCtx {
  user: AuthUser | null
  login:  (user: AuthUser) => void
  logout: () => void
  loginWithApi: (email: string, password: string) => Promise<{ success: boolean; user?: AuthUser; error?: string }>
  isLoggedIn: boolean; isAdmin: boolean; isEscort: boolean; isClient: boolean
  isPendingEscort: boolean
}

const AuthContext = createContext<AuthCtx>({
  user: null, login: () => {}, logout: () => {},
  loginWithApi: async () => ({ success: false, user: undefined }),
  isLoggedIn: false, isAdmin: false, isEscort: false, isClient: false, isPendingEscort: false,
})

const KEY = 'w3c_user'
const SS_KEY = 'w3c_ss_user'

function apiUserToAuthUser(u: ApiUser): AuthUser {
  return {
    id:    u.id,
    name:  u.name,
    email: u.email,
    role:  u.role === 'user' ? 'client' : u.role as UserRole,
    avatar:   u.avatar   ?? undefined,
    phone:    u.phone    ?? undefined,
    approved: u.approved,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const ss = sessionStorage.getItem(SS_KEY)
      if (ss) return JSON.parse(ss)
      const s = localStorage.getItem(KEY)
      return s ? JSON.parse(s) : null
    } catch { return null }
  })

  const isImpersonating = !!sessionStorage.getItem(SS_KEY)

  const login = useCallback((u: AuthUser) => {
    setUser(u)
    if (isImpersonating) {
      try { sessionStorage.setItem(SS_KEY, JSON.stringify(u)) } catch {}
    } else {
      try { localStorage.setItem(KEY, JSON.stringify(u)) } catch {}
    }
  }, [isImpersonating])

  const logout = useCallback(() => {
    setUser(null)
    clearToken()
    try { localStorage.removeItem(KEY) } catch {}
    try { sessionStorage.removeItem(SS_KEY) } catch {}
  }, [])

  // On mount, refresh approved status from server so approved escorts
  // don't stay stuck on the pending-approval page after admin approves them
  useEffect(() => {
    const token = getToken()
    if (!token || !user) return
    fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const updated: AuthUser = {
          ...user,
          approved: data.approved,
          name: data.name ?? user.name,
          avatar: data.avatar ?? user.avatar,
        }
        setUser(updated)
        try { localStorage.setItem(KEY, JSON.stringify(updated)) } catch {}
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loginWithApi = useCallback(async (email: string, password: string): Promise<{ success: boolean; user?: AuthUser; error?: string }> => {
    try {
      const res = await api.auth.login(email, password)
      setToken(res.token)
      const u = apiUserToAuthUser(res.user)
      login(u)
      return { success: true, user: u }
    } catch (err: any) {
      if (err?.status === 401) return { success: false, error: 'Invalid email or password.' }
      return { success: false, error: 'Cannot reach the server. Please try again.' }
    }
  }, [login])

  const isPendingEscort = user?.role === 'escort' && user?.approved === false

  return (
    <AuthContext.Provider value={{
      user, login, logout, loginWithApi,
      isLoggedIn: !!user,
      isAdmin:  user?.role === 'admin',
      isEscort: user?.role === 'escort',
      isClient: user?.role === 'client',
      isPendingEscort,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
