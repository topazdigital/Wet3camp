import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface FollowContextType {
  following: Set<string>
  follow: (id: string) => void
  unfollow: (id: string) => void
  toggleFollow: (id: string) => void
  isFollowing: (id: string) => boolean
  followerCount: (id: string) => number
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

// Seed follower counts so each escort has a realistic base count
const BASE_FOLLOWERS: Record<string, number> = {
  '1': 4820, '2': 3210, '3': 5640, '4': 1980, '5': 7320,
  '6': 2450, '7': 1670, '8': 3890, '9': 2100, '10': 4430,
  '11': 980,  '12': 2760,'13': 1540,'14': 3200,'15': 890,
  '16': 5100, '17': 2300,'18': 1750,'19': 4670,'20': 3120,
  '21': 2890, '22': 1430,'23': 6780,'24': 2100,'25': 3450,
}

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

  const followerCount = useCallback((id: string) =>
    (BASE_FOLLOWERS[id] ?? 500) + (following.has(id) ? 1 : 0), [following])

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
