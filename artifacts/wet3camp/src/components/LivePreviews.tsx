import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'wouter'
import { Play, Radio } from 'lucide-react'

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

const FALLBACK_CLIPS: PreviewClip[] = [
  { id: 'nr-serenity', name: 'Serenity Spa', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741084499810/17424592838201.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741084499810/17424592838201.mp4.jpg' },
  { id: 'nr-clarabelle', name: 'Clarabelle Girls', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741043003141/17410430633104.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741043003141/17410430633104.mp4.jpg' },
  { id: 'nr-zira', name: 'Zira', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1742024826895/17420249584415.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1742024826895/17420249584415.mp4.jpg' },
  { id: 'nr-lexxie', name: 'Lexxie Spa', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/174104570734/17424595029770.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/174104570734/17424595029770.mp4.jpg' },
  { id: 'nr-samba', name: 'Samba', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741043522179/17410435862684.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741043522179/17410435862684.mp4.jpg' },
  { id: 'nr-soraya', name: 'Soraya', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741082620970/17432585428423.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741082620970/17432585428423.mp4.jpg' },
  { id: 'nr-nikita', name: 'Nikita', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1742107473274/17421082737474.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1742107473274/17421082737474.mp4.jpg' },
  { id: 'nr-shayana', name: 'Shayana', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741079347470/17416846763399.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741079347470/17416846763399.mp4.jpg' },
  { id: 'nr-sherry', name: 'Sherry', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1781335767695/17813699942409.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1781335767695/17813699942409.mp4.jpg' },
  { id: 'nr-milly', name: 'Milly', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741269649363/17498927817844.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741269649363/17498927817844.mp4.jpg' },
  { id: 'nr-becky', name: 'Becky', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741081313421/17410814477895.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741081313421/17410814477895.mp4.jpg' },
  { id: 'nr-mwende', name: 'Mwende', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741077850950/17680960868928.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741077850950/17680960868928.mp4.jpg' },
  { id: 'nr-profile-preview', name: 'Profile Preview', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741040819260/17415985638328.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741040819260/17415985638328.mp4.jpg' },
  { id: 'nr-akoth', name: 'Akoth', title: 'A short profile preview', videoUrl: 'https://nairobiraha.com/wp-content/uploads/1741040245930/17410404031948.mp4', poster: 'https://nairobiraha.com/wp-content/uploads/1741040245930/17410404031948.mp4.jpg' },
]

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

  useEffect(() => {
    let active = true
    fetch('/api/escort-videos?cat=Free')
      .then(response => {
        if (!response.ok) throw new Error('Could not load clips')
        return response.json()
      })
      .then((rows: EscortVideoRow[]) => {
        if (!active) return
        const uploaded = Array.isArray(rows)
          ? rows.map(toPreviewClip).filter((clip): clip is PreviewClip => clip !== null)
          : []
        setClips(uploaded.length ? uploaded : FALLBACK_CLIPS)
      })
      .catch(() => {
        if (active) setClips(FALLBACK_CLIPS)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return { clips, loading }
}

export function PreviewVideo({ clip, className, rounded = false }: { clip: PreviewClip; className: string; rounded?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
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
      className={`${className}${rounded ? ' rounded-full' : ''}`}
      data-testid={`video-preview-${clip.id}`}
    />
  )
}

export function PreviewStories() {
  const { clips, loading } = useLivePreviewClips()
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
  return (
    <section className="w-full px-3 sm:px-5 py-4 border-b border-color bg-dark-bg" aria-label="Profile video previews">
      <div className="mb-3 flex items-center gap-2">
        <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[9px] font-black tracking-[0.16em] text-amber-200">PRE-RECORDED</span>
        <span className="text-xs font-bold text-text-light">Profile previews</span>
        <span className="ml-auto text-[10px] text-text-muted">Not live broadcasts</span>
      </div>
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {clips.map(clip => (
          <div key={clip.id} className="flex w-[82px] flex-shrink-0 flex-col items-center gap-1.5">
            <div className="relative h-[76px] w-[76px] overflow-hidden rounded-full border border-amber-200/50 bg-card-bg p-[2px] shadow-[0_0_0_3px_rgba(255,255,255,0.04)]">
              <PreviewVideo clip={clip} className="h-full w-full object-cover" rounded />
              <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/75 px-1.5 py-1 text-[7px] font-black tracking-wider text-amber-100">PREVIEW</span>
            </div>
            <p className="max-w-[82px] truncate text-center text-[10px] font-semibold text-text-light" title={clip.name}>{clip.name}</p>
          </div>
        ))}
        <Link href="/videos" className="flex w-[76px] flex-shrink-0 flex-col items-center gap-1.5 text-text-muted hover:text-text-light">
          <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full border border-dashed border-color bg-card-bg"><Play size={20} /></span>
          <span className="text-[10px] font-semibold">More clips</span>
        </Link>
      </div>
    </section>
  )
}

export function PreviewClipGrid() {
  const { clips, loading } = useLivePreviewClips()
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 px-3 py-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 sm:px-5" aria-label="Loading preview clips">
        {[0, 1, 2, 3, 4, 5].map(index => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-card-bg" />)}
      </div>
    )
  }
  return (
    <section className="px-3 py-5 sm:px-5" aria-label="Prerecorded video previews">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-color pb-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-1 text-[9px] font-black tracking-[0.16em] text-amber-200">PRE-RECORDED</span>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted">Community clips</span>
          </div>
          <h2 className="text-lg font-black text-text-light">A first look, before the next live</h2>
          <p className="mt-1 text-xs text-text-muted">These are recorded profile videos, not live broadcasts.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-text-muted"><Radio size={12} /> Live broadcasts will appear here</div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {clips.map(clip => (
          <article key={clip.id} className="group overflow-hidden rounded-2xl border border-color bg-card-bg transition-colors hover:border-amber-200/40" data-testid={`card-preview-${clip.id}`}>
            <div className="relative aspect-[3/4] overflow-hidden bg-[#160f13]">
              <PreviewVideo clip={clip} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
              <span className="pointer-events-none absolute left-2 top-2 rounded-full border border-amber-100/25 bg-black/70 px-2 py-1 text-[9px] font-black tracking-[0.14em] text-amber-100">PREVIEW · NOT LIVE</span>
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
