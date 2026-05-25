import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from './api'
import { useAuth } from './auth-context'

interface FavoritesCtx {
  favorites: Set<string>
  toggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}

const FavoritesContext = createContext<FavoritesCtx>({
  favorites: new Set(),
  toggleFavorite: () => {},
  isFavorite: () => false,
})

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoggedIn) { setFavorites(new Set()); return }
    api.favorites.list()
      .then(ids => setFavorites(new Set(ids)))
      .catch(() => {})
  }, [isLoggedIn])

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    api.favorites.toggle(id).then(res => {
      setFavorites(prev => {
        const next = new Set(prev)
        res.saved ? next.add(id) : next.delete(id)
        return next
      })
    }).catch(() => {
      setFavorites(prev => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      })
    })
  }, [])

  const isFavorite = useCallback((id: string) => favorites.has(id), [favorites])

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => useContext(FavoritesContext)
