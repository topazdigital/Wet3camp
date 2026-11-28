import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

interface FollowContextType {
  following: Set<string>
  toggleFollow: (id: string) => Promise<void>
  isFollowing: (id: string) => boolean
  totalFollowing: number
}

const FollowContext = createContext<FollowContextType>({
  following: new Set<string>(),
  toggleFollow: async () => {},
  isFollowing: () => false,
  totalFollowing: 0,
})

export function FollowProvider({ children }: { children: React.ReactNode }) {
  const [following, setFollowing] = useState<Set<string>>(() => new Set<string>())
  const followingRef = useRef<Set<string>>(new Set())
  const revisionRef = useRef(0)
  const pendingIdsRef = useRef(new Set<string>())
  const { user, isLoggedIn, isAuthReady } = useAuth()
  const queryClient = useQueryClient()
  const accountId = isAuthReady && isLoggedIn && user?.id ? String(user.id) : null

  useEffect(() => {
    const revision = ++revisionRef.current
    let active = true
    pendingIdsRef.current.clear()
    followingRef.current = new Set<string>()
    setFollowing(new Set<string>())

    if (!accountId) return () => { active = false }

    api.follows.list()
      .then(ids => {
        if (!active || revisionRef.current !== revision) return
        const next = new Set(ids.map(String))
        followingRef.current = next
        setFollowing(next)
      })
      .catch(error => {
        if (!active || revisionRef.current !== revision) return
        console.error('[follows] Could not load account follows:', error)
        toast.error('Could not load your followed profiles. Please refresh and try again.')
      })

    return () => { active = false }
  }, [accountId])

  const toggleFollow = useCallback(async (id: string) => {
    if (!id) return
    if (!accountId) {
      toast.error('Sign in to follow profiles.')
      return
    }
    if (pendingIdsRef.current.has(id)) return

    pendingIdsRef.current.add(id)
    const wasFollowing = followingRef.current.has(id)
    const shouldFollow = !wasFollowing
    const optimistic = new Set(followingRef.current)
    if (shouldFollow) optimistic.add(id)
    else optimistic.delete(id)
    followingRef.current = optimistic
    setFollowing(optimistic)
    ++revisionRef.current

    try {
      const result = await api.follows.set(id, shouldFollow)
      if (String(user?.id ?? '') !== accountId) return

      const confirmed = new Set(followingRef.current)
      if (result.following) confirmed.add(id)
      else confirmed.delete(id)
      followingRef.current = confirmed
      setFollowing(confirmed)

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['escort'] }),
        queryClient.invalidateQueries({ queryKey: ['escorts'] }),
      ])
    } catch (error) {
      if (String(user?.id ?? '') === accountId) {
        const reverted = new Set(followingRef.current)
        if (wasFollowing) reverted.add(id)
        else reverted.delete(id)
        followingRef.current = reverted
        setFollowing(reverted)
      }
      console.error('[follows] Could not update account follow:', error)
      toast.error('Could not update follow status. Please try again.')
    } finally {
      pendingIdsRef.current.delete(id)
    }
  }, [accountId, queryClient, user?.id])

  const isFollowing = useCallback((id: string) => following.has(String(id)), [following])

  return (
    <FollowContext.Provider value={{
      following,
      toggleFollow,
      isFollowing,
      totalFollowing: following.size,
    }}>
      {children}
    </FollowContext.Provider>
  )
}

export function useFollow() {
  return useContext(FollowContext)
}

export default FollowContext
