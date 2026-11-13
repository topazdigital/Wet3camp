import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import { Play, Radio } from 'lucide-react'
import { getSlug } from '@/data/escorts'
import { api, type ApiEscort } from '@/lib/api'

export interface PreviewClip {
  id: string
  name: string
  title: string
  videoUrl: string
  poster?: string
  escortId?: number
}

interface EscortVideoRow {
  id?: number | string
  video_url?: string
  thumbnail?: string
  title?: string
  escort_name?: string
  escort_image?: string
  is_locked?: boolean | number | string
  escort_id?: number
}

function safeMediaUrl(value?: string): string | undefined {
  if (!value || typeof window === 'undefined') return undefined
  try {
    const url = new URL(value, window.location.origin)
    const sameOrigin = url.origin === window.location.origin
    const trustedExternal = url.protocol === 'https:' &&
      (url.hostname === 'nairobiraha.com' || url.hostname.endsWith('.nairobiraha.com'))
    return sameOrigin || trustedExternal ? url.href : undefined
  } catch {
    return undefined
  }
}

function isUnlocked(row: EscortVideoRow) {
  return row.is_locked === false || row.is_locked === 0 || row.is_locked === '0'
}

function toPreviewClip(row: EscortVideoRow): PreviewClip | null {
  if (!isUnlocked(row)) return null
  const videoUrl = safeMediaUrl(row.video_url)
  if (!videoUrl) return null
  const poster = safeMediaUrl(row.thumbnail) || safeMediaUrl(row.escort_image)
  const name = row.escort_name?.trim() || 'Community profile'
  return {
    id: `upload-${row.id ?? row.escort_id ?? videoUrl}`,
    name,
    title: row.title?.trim() || 'Community clip',
    videoUrl,
    poster,
    escortId: row.escort_id,
  }
}

export function useLivePreviewClips() {
  const [clips, setClips] = useState<PreviewClip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    const fetchClips = () => {
      fetch('/api/escort-videos?cat=Free', { cache: 'no-store' })
        .then(response => {
          if (!response.ok) throw new Error('Could not load clips')
          return response.json()
        })
        .then((rows: EscortVideoRow[]) => {
          if (!active) return
          const latest = Array.isArray(rows)
            ? rows.map(toPreviewClip).filter((clip): clip is PreviewClip => clip !== null).slice(0, 24)
            : []
          setClips(latest)
          setError(false)
        })
        .catch(() => {
          if (active) setError(true)
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') fetchClips()
    }
    fetchClips()
    const interval = window.setInterval(() => {
      if (!document.hidden) fetchClips()
    }, 60000)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  return { clips, loading, error }
}

export function PreviewVideo({ clip, className, rounded = false }: { clip: PreviewClip; className: string; rounded?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(preference.matches)
    update()
    preference.addEventListener?.('change', update)
    return () => preference.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !reducedMotion) {
        const playback = video.play()
        playback?.catch(() => {})
      } else {
        video.pause()
      }
    }, { threshold: 0.2 })
    observer.observe(video)
    return () => {
      observer.disconnect()
      video.pause()
    }
  }, [reducedMotion, clip.videoUrl])

  return (
    <>
      <video
        ref={videoRef}
        src={clip.videoUrl}
        poster={clip.poster}
        muted
        loop
        playsInline
        controls
        preload="metadata"
        aria-label={`${clip.name}: prerecorded preview clip. Not a live broadcast.`}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className={`${className}${rounded ? ' rounded-full' : ''}`}
        data-testid={`video-preview-${clip.id}`}
      />
      {!isPlaying && (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current
            if (video) {
              video.muted = true
              video.play().catch(() => setIsPlaying(false))
            }
          }}
          aria-label={`Play ${clip.name} profile preview`}
          className={`absolute inset-0 z-10 flex items-center justify-center ${rounded ? 'rounded-full' : ''}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-amber-100/50 bg-black/70 text-amber-100 shadow-lg">
            <Play size={16} fill="currentColor" />
          </span>
        </button>
      )}
    </>
  )
}

export function PreviewStories() {
  const { clips, loading: clipsLoading, error: clipsError } = useLivePreviewClips()
  const [profiles, setProfiles] = useState<ApiEscort[]>([])
  const [profilesLoading, setProfilesLoading] = useState(true)
  const [startIndex, setStartIndex] = useState(0)

  useEffect(() => {
    let active = true
    const loadProfiles = () => {
      api.escorts.list({ sort: 'newest', limit: 12 })
        .then(result => {
          if (active) setProfiles(Array.isArray(result.data) ? result.data : [])
        })
        .catch(() => {
          if (active) setProfiles([])
        })
        .finally(() => {
          if (active) setProfilesLoading(false)
        })
    }
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') loadProfiles()
    }

    loadProfiles()
    const interval = window.setInterval(() => {
      if (!document.hidden) loadProfiles()
    }, 60000)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    return () => {
      active = false
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
    }
  }, [])

  const storyCount = clips.length || profiles.length
  useEffect(() => {
    if (storyCount < 2) {
      setStartIndex(0)
      return
    }
    setStartIndex(Math.floor(Math.random() * storyCount))
    const rotationInterval = window.setInterval(() => {
      setStartIndex(current => (current + 1) % storyCount)
    }, 15000)
    return () => window.clearInterval(rotationInterval)
  }, [storyCount])

  const loading = clipsLoading || (clips.length === 0 && profilesLoading)
  if (loading) {
    return (
      <section className="w-full px-3 sm:px-5 py-4 border-b border-color bg-dark-bg" aria-label="Loading profile previews">
        <div className="mb-3 h-3 w-40 rounded bg-card-bg animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map(index => <div key={index} className="h-[76px] w-[76px] flex-shrink-0 rounded-full bg-card-bg animate-pulse" />)}
        </div>
      </section>
    )
  }
  const showingClips = clips.length > 0
  const visibleClips = showingClips
    ? Array.from(
        { length: Math.min(6, clips.length) },
        (_, index) => clips[(startIndex + index) % clips.length],
      )
    : []
  const visibleProfiles = !showingClips
    ? Array.from(
        { length: Math.min(6, profiles.length) },
        (_, index) => profiles[(startIndex + index) % profiles.length],
      )
    : []

  const title = showingClips ? 'Community videos' : profiles.length ? 'Latest profiles' : 'Live Now'
  const subtitle = showingClips
    ? 'Recorded profile clips'
    : profiles.length
      ? 'Recently added escorts'
      : clipsError
        ? 'Recent videos could not be loaded'
        : 'No active broadcasts right now'

  return (
    <section className="w-full px-3 sm:px-5 py-4 border-b border-color bg-dark-bg" aria-label={title}>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-7 w-1 rounded-full bg-gradient-to-b from-amber-200 via-amber-500 to-amber-900" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-xs font-bold text-text-light">{title}</p>
          <p className="text-[10px] text-text-muted">{subtitle}</p>
        </div>
        <span className="ml-auto h-px w-12 bg-gradient-to-r from-transparent to-amber-200/50 sm:w-24" aria-hidden="true" />
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {visibleClips.map(clip => (
          <div key={clip.id} className="flex w-[82px] flex-shrink-0 flex-col items-center gap-1.5">
            <div className="relative h-[76px] w-[76px] overflow-hidden rounded-full border border-amber-200/50 bg-card-bg p-[2px] shadow-[0_0_0_3px_rgba(255,255,255,0.04)]">
              <PreviewVideo clip={clip} className="h-full w-full object-cover" rounded />
            </div>
            <p className="max-w-[82px] truncate text-center text-[10px] font-semibold text-text-light" title={clip.name}>{clip.name}</p>
          </div>
        ))}
        {visibleProfiles.map(profile => {
          const photo = profile.image
            ? profile.image.startsWith('http')
              ? `/api/image-proxy?url=${encodeURIComponent(profile.image)}`
              : profile.image
            : ''
          return (
            <Link
              key={profile.id}
              href={`/@${getSlug(profile.name)}`}
              className="group flex w-[82px] flex-shrink-0 flex-col items-center gap-1.5"
              data-testid={`story-profile-${profile.id}`}
            >
              <span className="relative block h-[76px] w-[76px] rounded-full bg-gradient-to-br from-amber-200 via-amber-500 to-amber-900 p-[3px] shadow-[0_0_14px_#FFD70040] transition-shadow group-hover:shadow-[0_0_20px_#FFD70070]">
                <span className="block h-full w-full rounded-full bg-dark-bg p-[2px]">
                  <span className="block h-full w-full overflow-hidden rounded-full bg-card-bg">
                    {photo ? (
                      <img src={photo} alt={profile.name} loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl font-bold text-amber-200">
                        {(profile.name || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </span>
                </span>
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-dark-bg bg-[#B8860B] px-2 py-0.5 text-[8px] font-black leading-none tracking-wide text-white">
                  NEW
                </span>
              </span>
              <span className="max-w-[82px] truncate text-center text-[10px] font-semibold text-text-light" title={profile.name}>
                {profile.name.split(' ')[0]}
              </span>
            </Link>
          )
        })}
        {clips.length > 0 ? (
          <Link href="/videos" className="flex w-[76px] flex-shrink-0 flex-col items-center gap-1.5 text-text-muted hover:text-text-light">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-dashed border-color bg-card-bg"><Play size={20} /></span>
            <span className="text-[10px] font-semibold">More clips</span>
          </Link>
        ) : profiles.length > 0 ? (
          <Link href="/search" className="flex w-[76px] flex-shrink-0 flex-col items-center gap-1.5 text-text-muted hover:text-text-light">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-dashed border-color bg-card-bg"><Play size={20} /></span>
            <span className="text-[10px] font-semibold">Browse</span>
          </Link>
        ) : (
          <Link href="/live" className="flex w-[76px] flex-shrink-0 flex-col items-center gap-1.5 text-text-muted hover:text-text-light">
            <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-dashed border-color bg-card-bg"><Radio size={20} /></span>
            <span className="text-[10px] font-semibold">See live</span>
          </Link>
        )}
      </div>
    </section>
  )
}

export function PreviewClipGrid() {
  const { clips, loading, error } = useLivePreviewClips()
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-3 py-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 sm:px-5" aria-label="Loading preview clips">
        {[0, 1, 2, 3, 4, 5].map(index => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-card-bg" />)}
      </div>
    )
  }
  if (clips.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-text-muted" role="status">
        {error ? 'Recent videos could not be loaded right now.' : 'No recent community clips are available yet.'}
      </p>
    )
  }
  return (
    <section className="px-3 py-5 sm:px-5" aria-label="Community profile videos">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-color pb-3">
        <div>
          <div className="mb-2 h-[2px] w-12 rounded-full bg-gradient-to-r from-amber-200 via-amber-500 to-transparent" aria-hidden="true" />
          <h2 className="text-lg font-black text-text-light">Community profile clips</h2>
          <p className="mt-1 text-xs text-text-muted">Recorded profile videos shared by the community.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted"><Radio size={12} /> Live broadcasts will appear here</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {clips.map(clip => (
          <article key={clip.id} className="group overflow-hidden rounded-2xl border border-color bg-card-bg transition-all hover:border-amber-200/50 hover:shadow-[0_10px_36px_rgba(245,158,11,0.12)]" data-testid={`card-preview-${clip.id}`}>
            <div className="relative aspect-[3/4] overflow-hidden bg-[#160f13]">
              <PreviewVideo clip={clip} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="pointer-events-none absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />
              <p className="pointer-events-none absolute bottom-3 left-3 right-3 truncate text-sm font-bold text-white">{clip.name}</p>
            </div>
            <div className="p-3">
              <p className="truncate text-xs text-text-muted">{clip.title}</p>
              {clip.escortId && (
                <Link href={`/profile/${clip.escortId}`} className="mt-2 inline-flex text-[10px] font-semibold text-amber-200 hover:text-amber-100">View profile</Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
