import React, { createContext, useContext, useState, useCallback } from 'react'

export type UserRole = 'client' | 'escort' | 'admin'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  city?: string
  area?: string
  lat?: number
  lng?: number
  avatar?: string
  profileId?: string
  phone?: string
}

interface AuthCtx {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  isLoggedIn: boolean
  isAdmin: boolean
  isEscort: boolean
  isClient: boolean
}

const AuthContext = createContext<AuthCtx>({
  user: null, login: () => {}, logout: () => {},
  isLoggedIn: false, isAdmin: false, isEscort: false, isClient: false,
})

const KEY = 'w3c_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null } catch { return null }
  })

  const login = useCallback((u: AuthUser) => {
    setUser(u)
    try { localStorage.setItem(KEY, JSON.stringify(u)) } catch {}
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try { localStorage.removeItem(KEY) } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{
      user, login, logout,
      isLoggedIn: !!user,
      isAdmin: user?.role === 'admin',
      isEscort: user?.role === 'escort',
      isClient: user?.role === 'client',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export interface DemoAccount extends AuthUser { password: string }

export const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  'admin@wet3camp.com': {
    id: 'admin-1', name: 'Platform Admin', email: 'admin@wet3camp.com',
    role: 'admin', password: 'Admin@Wet3Camp2024',
  },
  'amara@wet3camp.com': {
    id: 'escort-1', name: 'Amara K.', email: 'amara@wet3camp.com',
    role: 'escort', password: 'Test1234!', profileId: '1',
    city: 'Nairobi', area: 'Nairobi CBD',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face',
  },
  'client@test.com': {
    id: 'client-1', name: 'John K.', email: 'client@test.com',
    role: 'client', password: 'Test1234!',
    city: 'Nairobi', area: 'Westlands',
  },
}

export function tryLogin(email: string, password: string): AuthUser | null {
  const acc = DEMO_ACCOUNTS[email.toLowerCase().trim()]
  if (acc && acc.password === password) {
    const { password: _, ...user } = acc
    return user as AuthUser
  }
  return null
}
