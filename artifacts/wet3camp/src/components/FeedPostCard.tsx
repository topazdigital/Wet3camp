import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { BadgeCheck, Bookmark, ChevronDown, ChevronUp, CornerDownRight, Flag, Heart, MessageCircle, Send, Share2, Trash2, X } from 'lucide-react'
import { Link } from 'wouter'
import ProfilePhoto from '@/components/ProfilePhoto'
import { api, type FeedPost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { getSlug } from '@/data/escorts'

const TIER_COLOR: Record<string, string> = { elite: '#8B0000', vip: '#B8860B', premium: '#FFD700', standard: '#6c757d' }
const REPORT_REASONS = ['Spam', 'Inappropriate content', 'Unauthorized media', 'Other']

interface Comment {
  id: number
  parent_id: number | null
  author_name: string
  body: string
  created_at: string
}

function guestKey() {
  const keyName = 'wc_gk'
  let key = localStorage.getItem(keyName)
  if (!key) { key = crypto.randomUUID(); localStorage.setItem(keyName, key) }
  return key
}

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000))
  if (!Number.isFinite(seconds)) return ''
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function CommentThread({ comments, parentId, depth = 0, onReply }: {
  comments: Comment[]
  parentId: number | null
  depth?: number
  onReply: (parentId: number, authorName: string) => void
}) {
  const children = comments.filter(comment => comment.parent_id === parentId)
  if (!children.length) return null
  return (
    <div className={depth ? 'ml-5 border-l border-color/40 pl-3' : ''}>
      {children.map(comment => (
        <div key={comment.id} className="mb-3">
          <div className="flex items-start gap-2">
            <div aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1a0000] text-[10px] font-black text-[#d2a0a0]">
              {comment.author_name[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="rounded-xl bg-[#150505] px-3 py-2">
                <span className="text-[11px] font-bold text-text-light">{comment.author_name}</span>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-xs leading-relaxed text-text-light">{comment.body}</p>
              </div>
              <div className="ml-1 mt-1 flex items-center gap-3">
                <span className="text-[10px] text-text-muted">{timeAgo(comment.created_at)}</span>
                <button type="button" onClick={() => onReply(comment.id, comment.author_name)} className="flex items-center gap-0.5 text-[10px] font-semibold text-[#d89191] hover:text-white">
                  <CornerDownRight size={10} /> Reply
                </button>
              </div>
            </div>
          </div>
          <CommentThread comments={comments} parentId={comment.id} depth={depth + 1} onReply={onReply} />
        </div>
      ))}
    </div>
  )
}

export default function FeedPostCard({ post, onRemoved }: { post: FeedPost; onRemoved: (id: string) => void }) {
  const { user, isLoggedIn } = useAuth()
  const [likeCount, setLikeCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoaded, setCommentsLoaded] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [commentName, setCommentName] = useState(user?.name ?? '')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [lightbox, setLightbox] = useState<string | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [removing, setRemoving] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const commentInputRef = useRef<HTMLInputElement>(null)
  const isOwn = !!(user?.id && String(user.id) === String(post.user_id))
  const profileHref = `/@${getSlug(post.escort_name)}`
  const tierColor = TIER_COLOR[(post.tier ?? 'standard').toLowerCase()] ?? TIER_COLOR.standard
  const rootComments = comments.filter(comment => comment.parent_id === null)

  useEffect(() => {
    const key = guestKey()
    fetch(`/api/feeds/posts/${encodeURIComponent(post.id)}/likes?gk=${encodeURIComponent(key)}`)
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (data) { setLikeCount(Number(data.count ?? 0)); setIsLiked(Boolean(data.liked)) } })
      .catch(() => {})
  }, [post.id])

  useEffect(() => {
    if (!lightbox) return
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setLightbox(null) }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [lightbox])

  const toggleLike = async () => {
    const key = guestKey()
    const nextLiked = !isLiked
    setIsLiked(nextLiked)
    setLikeCount(value => Math.max(0, value + (nextLiked ? 1 : -1)))
    try {
      const response = await fetch(`/api/feeds/posts/${encodeURIComponent(post.id)}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestKey: key, unlike: !nextLiked }),
      })
      if (!response.ok) throw new Error('Could not update like')
      const data = await response.json()
      setLikeCount(Number(data.count ?? 0))
    } catch {
      setIsLiked(!nextLiked)
      setLikeCount(value => Math.max(0, value + (nextLiked ? -1 : 1)))
    }
  }

  const loadComments = useCallback(async () => {
    if (commentsLoaded) return
    try {
      const response = await fetch(`/api/feeds/posts/${encodeURIComponent(post.id)}/comments`)
      const data = await response.json()
      setComments(Array.isArray(data) ? data : [])
    } catch {
      setInputMessage('Comments could not be loaded. Try again.')
    } finally {
      setCommentsLoaded(true)
    }
  }, [commentsLoaded, post.id])

  const toggleComments = () => {
    const next = !showComments
    setShowComments(next)
    if (next) void loadComments()
  }

  const replyToComment = (id: number, name: string) => {
    setReplyTo({ id, name })
    setShowComments(true)
    void loadComments()
    setTimeout(() => commentInputRef.current?.focus(), 100)
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault()
    const body = commentInput.trim()
    if (!body) return
    setSubmittingComment(true)
    setInputMessage('')
    try {
      const response = await fetch(`/api/feeds/posts/${encodeURIComponent(post.id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body, author_name: commentName.trim() || 'Anonymous', parent_id: replyTo?.id ?? null }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message ?? 'Could not add comment')
      setComments(current => [...current, data])
      setCommentsLoaded(true)
      setCommentInput('')
      setReplyTo(null)
    } catch (error) {
      setInputMessage(error instanceof Error ? error.message : 'Could not add comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const sharePost = async () => {
    const url = `${window.location.origin}/feeds#feed-post-${post.id}`
    if (navigator.share) {
      await navigator.share({ title: `${post.escort_name} on Wet3Camp`, text: post.body, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
      setInputMessage('Post link copied.')
    }
  }

  const submitReport = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.feed.reportPost(post.id, { reason: reportReason, details: reportDetails.trim() })
      setReportMessage('Thanks. Your report was sent to the team.')
      setReportOpen(false)
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Could not send report.')
    }
  }

  const removePost = async () => {
    if (!window.confirm('Remove this post from the feed?')) return
    setRemoving(true)
    try {
      await api.feed.removePost(post.id)
      onRemoved(post.id)
    } catch (error) {
      setReportMessage(error instanceof Error ? error.message : 'Could not remove post.')
      setRemoving(false)
    }
  }

  return (
    <>
      <article id={`feed-post-${post.id}`} className="overflow-hidden rounded-2xl border border-color bg-card-bg transition-colors hover:border-[#8B0000]/35">
        <header className="flex items-center gap-3 px-3 pb-2.5 pt-3 sm:px-4 sm:pt-4">
          <Link href={profileHref} aria-label={`View ${post.escort_name}'s profile`} className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border-2" style={{ borderColor: tierColor }}>
            <ProfilePhoto src={post.escort_image} alt={`${post.escort_name} profile`} name={post.escort_name} width={320} className="h-full w-full object-cover" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <Link href={profileHref} className="truncate text-sm font-bold text-text-light hover:underline">{post.escort_name}</Link>
              {post.verified && <BadgeCheck size={15} className="shrink-0 text-[#38bdf8]" aria-label="Verified profile" />}
              {post.tier && post.tier !== 'standard' && (
                <span className="rounded px-1.5 py-0.5 text-[9px] font-bold capitalize" style={{ background: `${tierColor}25`, color: tierColor }}>{post.tier}</span>
              )}
              {post.online && <span className="h-2 w-2 rounded-full bg-[#28a745]" aria-label="Online" />}
            </div>
            <p className="truncate text-[10px] text-text-muted">
              @{post.escort_name.replace(/[\s.]/g, '').toLowerCase()} · {post.area ? `${post.area}, ` : ''}{post.city || 'Kenya'} · {timeAgo(post.created_at)}
            </p>
          </div>
          {isOwn ? (
            <button type="button" onClick={removePost} disabled={removing} aria-label="Remove your post" className="rounded-lg p-2 text-text-muted hover:bg-[#EF4444]/10 hover:text-[#EF4444] disabled:opacity-50">
              <Trash2 size={15} />
            </button>
          ) : (
            <button type="button" onClick={() => { if (!isLoggedIn) { setReportMessage('Sign in to report a post.'); return } setReportOpen(value => !value) }} aria-expanded={reportOpen} aria-label="Report this post" className="rounded-lg p-2 text-text-muted hover:bg-dark-bg hover:text-text-light">
              <Flag size={15} />
            </button>
          )}
        </header>

        {reportOpen && (
          <form onSubmit={submitReport} className="mx-3 mb-3 rounded-xl border border-color bg-dark-bg p-3 sm:mx-4">
            <label htmlFor={`report-reason-${post.id}`} className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Why are you reporting this?</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <select id={`report-reason-${post.id}`} value={reportReason} onChange={event => setReportReason(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-color bg-card-bg px-3 py-2 text-xs text-text-light">
                {REPORT_REASONS.map(reason => <option key={reason}>{reason}</option>)}
              </select>
              <input value={reportDetails} onChange={event => setReportDetails(event.target.value)} maxLength={500} placeholder="Optional details" className="min-w-0 flex-1 rounded-lg border border-color bg-card-bg px-3 py-2 text-xs text-text-light placeholder:text-text-muted" />
              <button type="submit" className="rounded-lg bg-[#8B0000] px-3 py-2 text-xs font-bold text-white hover:bg-[#a00000]">Send report</button>
              <button type="button" onClick={() => setReportOpen(false)} aria-label="Close report form" className="rounded-lg border border-color px-3 py-2 text-text-muted"><X size={14} /></button>
            </div>
          </form>
        )}

        {post.body && (
          <div className="px-3 pb-3 sm:px-4">
            <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-text-light ${expanded ? '' : 'line-clamp-4'}`}>{post.body}</p>
            {post.body.length > 240 && (
              <button type="button" onClick={() => setExpanded(value => !value)} className="mt-1 text-xs font-semibold text-[#e4a0a0] hover:text-white">
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {post.media.length > 0 && (
          <div className={`grid overflow-hidden bg-black ${post.media.length > 1 ? 'grid-cols-2 gap-1' : 'grid-cols-1'}`}>
            {post.media.map((item, index) => item.type === 'video' ? (
              <video
                key={`${item.url}-${index}`}
                src={item.url}
                controls
                playsInline
                preload="metadata"
                className="h-[192px] w-full bg-black object-contain sm:h-[224px] lg:h-[256px]"
              />
            ) : (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setLightbox(item.url)}
                aria-label={`View photo ${index + 1} from ${post.escort_name}'s post`}
                className={`flex h-[192px] min-w-0 items-center justify-center overflow-hidden bg-black sm:h-[224px] lg:h-[256px] ${post.media.length > 1 ? 'h-[136px] sm:h-[168px] lg:h-[192px]' : ''}`}
              >
                <img
                  src={item.url}
                  alt={`Post photo ${index + 1} by ${post.escort_name}`}
                  loading="lazy"
                  decoding="async"
                  className={`h-full w-full ${post.media.length > 1 ? 'object-cover' : 'object-contain'}`}
                />
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-color/50 px-3 py-2.5 sm:px-4">
          <div className="flex items-center gap-4">
            <button type="button" onClick={toggleLike} aria-pressed={isLiked} className={`flex items-center gap-1.5 text-xs transition-colors ${isLiked ? 'text-[#E91E63]' : 'text-text-muted hover:text-[#E91E63]'}`}>
              <Heart size={16} className={isLiked ? 'fill-[#E91E63]' : ''} /><span className="font-semibold">{likeCount}</span>
            </button>
            <button type="button" onClick={toggleComments} aria-expanded={showComments} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-light">
              <MessageCircle size={16} /><span className="font-semibold">{comments.length || (commentsLoaded ? 0 : '')}</span>
              {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {reportMessage && <span role="status" className="max-w-48 text-right text-[10px] text-text-muted">{reportMessage}</span>}
            <button type="button" onClick={sharePost} aria-label="Share post" className="rounded-lg p-2 text-text-muted hover:text-text-light"><Share2 size={15} /></button>
            <Bookmark size={15} className="text-text-muted" aria-hidden="true" />
          </div>
        </div>

        {showComments && (
          <div className="space-y-3 border-t border-color/40 px-3 py-3 sm:px-4">
            {commentsLoaded && rootComments.length === 0 && <p className="py-2 text-center text-[11px] text-text-muted">No comments yet. Be the first.</p>}
            {!commentsLoaded && <div className="py-2 text-center text-xs text-text-muted">Loading comments…</div>}
            {commentsLoaded && <CommentThread comments={comments} parentId={null} onReply={replyToComment} />}
            {replyTo && (
              <div className="flex items-center gap-2 rounded-lg bg-[#8B0000]/10 px-3 py-2 text-[11px] text-text-muted">
                <CornerDownRight size={12} /> Replying to <span className="font-bold text-text-light">{replyTo.name}</span>
                <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply" className="ml-auto"><X size={13} /></button>
              </div>
            )}
            <form onSubmit={submitComment} className="space-y-2">
              <input value={commentName} onChange={event => setCommentName(event.target.value)} maxLength={60} placeholder="Your name (optional)" aria-label="Comment author name" className="w-full rounded-lg border border-color/50 bg-[#150505] px-3 py-2 text-xs text-text-light placeholder:text-text-muted focus:outline-none focus:border-[#8B0000]/60" />
              <div className="flex gap-2">
                <input ref={commentInputRef} value={commentInput} onChange={event => setCommentInput(event.target.value)} maxLength={1000} placeholder={replyTo ? `Reply to ${replyTo.name}…` : 'Write a comment…'} className="min-w-0 flex-1 rounded-lg border border-color/50 bg-[#150505] px-3 py-2 text-xs text-text-light placeholder:text-text-muted focus:outline-none focus:border-[#8B0000]/60" />
                <button type="submit" disabled={!commentInput.trim() || submittingComment} aria-label="Send comment" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B0000] text-white disabled:opacity-40"><Send size={14} /></button>
              </div>
              {inputMessage && <p role="status" className="text-[10px] text-text-muted">{inputMessage}</p>}
            </form>
          </div>
        )}
      </article>

      {lightbox && (
        <div role="dialog" aria-modal="true" aria-label="Expanded post photo" onClick={() => setLightbox(null)} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm">
          <button type="button" onClick={() => setLightbox(null)} aria-label="Close photo" className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"><X size={20} /></button>
          <img src={lightbox} alt={`Full-size post photo by ${post.escort_name}`} onClick={event => event.stopPropagation()} className="max-h-[92vh] max-w-[96vw] object-contain" />
        </div>
      )}
    </>
  )
}
