import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface FollowContextType {
  following: Set<string>
  follow: (id: string) => void
  unfollow: (id: string) => void
  toggleFollow: (id: string) => void
  isFollowing: (id: string) => boolean
  followerCount: (id: string, baseCount?: number) => number
  totalFollowing: number
}

const FollowContext = createContext<FollowContextType>({
  following: new Set(),
  follow: () => {},
  unfollow: () => {},
  toggleFollow: () => {},
  isFollowing: () => false,
  followerCount: () => 0,
  totalFollowing: 0,
})

const STORAGE_KEY = 'wet3camp_following'

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [following, setFollowing] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...following]))
  }, [following])

  const follow = useCallback((id: string) =>
    setFollowing(prev => new Set([...prev, id])), [])

  const unfollow = useCallback((id: string) =>
    setFollowing(prev => { const n = new Set(prev); n.delete(id); return n }), [])

  const toggleFollow = useCallback((id: string) =>
    setFollowing(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    }), [])

  const isFollowing = useCallback((id: string) => following.has(id), [following])

  const followerCount = useCallback((id: string, baseCount = 0) =>
    baseCount + (following.has(id) ? 1 : 0), [following])

  return (
    <FollowContext.Provider value={{
      following, follow, unfollow, toggleFollow, isFollowing,
      followerCount, totalFollowing: following.size,
    }}>
      {children}
    </FollowContext.Provider>
  )
}

export function useFollow() {
  return useContext(FollowContext)
}

export default FollowContext
