import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, LoaderCircle, Send, Smile, Video, X } from 'lucide-react'
import { api, type FeedPost, type FeedPostMedia } from '@/lib/api'

const MAX_PHOTOS = 4
const MAX_PHOTO_BYTES = 8 * 1024 * 1024
const MAX_VIDEO_BYTES = 30 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/mov']
const EMOJIS = ['😀', '🥰', '😉', '🔥', '✨', '❤️', '🌹', '👑']

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read this file'))
    reader.onerror = () => reject(new Error('Could not read this file'))
    reader.readAsDataURL(file)
  })
}

export default function FeedPostComposer({ onPublished }: { onPublished: (post: FeedPost) => void }) {
  const [body, setBody] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [mediaKind, setMediaKind] = useState<'image' | 'video' | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const [previews, setPreviews] = useState<string[]>([])

  useEffect(() => {
    const urls = files.map(file => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach(url => URL.revokeObjectURL(url))
  }, [files])

  const choosePhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (mediaKind === 'video') { setMessage('Remove the video before adding photos.'); return }
    if (selected.length > MAX_PHOTOS) { setMessage(`Choose up to ${MAX_PHOTOS} photos.`); return }
    if (selected.some(file => !IMAGE_TYPES.includes(file.type))) { setMessage('Use JPG, PNG, WebP, or GIF photos.'); return }
    if (selected.some(file => file.size > MAX_PHOTO_BYTES)) { setMessage('Each photo must be 8 MB or smaller.'); return }
    setMessage('')
    setFiles(selected)
    setMediaKind(selected.length ? 'image' : null)
  }

  const chooseVideo = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0]
    event.target.value = ''
    if (!selected) return
    if (files.length) { setMessage('Remove the photos before adding a video.'); return }
    if (!VIDEO_TYPES.includes(selected.type)) { setMessage('Use an MP4, WebM, or MOV video.'); return }
    if (selected.size > MAX_VIDEO_BYTES) { setMessage('Videos must be 30 MB or smaller.'); return }
    setMessage('')
    setFiles([selected])
    setMediaKind('video')
  }

  const insertEmoji = (emoji: string) => {
    const input = textareaRef.current
    const start = input?.selectionStart ?? body.length
    const end = input?.selectionEnd ?? body.length
    const next = `${body.slice(0, start)}${emoji}${body.slice(end)}`
    setBody(next)
    requestAnimationFrame(() => {
      input?.focus()
      input?.setSelectionRange(start + emoji.length, start + emoji.length)
    })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const trimmedBody = body.trim()
    if (!trimmedBody && files.length === 0) { setMessage('Add text or media before posting.'); return }
    if (trimmedBody.length > 2000) { setMessage('Keep posts under 2,000 characters.'); return }
    setSubmitting(true)
    setMessage('')
    try {
      const media: FeedPostMedia[] = []
      for (const file of files) {
        const uploaded = await api.upload.feed(await readAsDataUrl(file), file.name)
        media.push({ type: mediaKind ?? (file.type.startsWith('video/') ? 'video' : 'image'), url: uploaded.url })
      }
      const post = await api.feed.createPost({ body: trimmedBody, media })
      setBody('')
      setFiles([])
      setMediaKind(null)
      setShowEmojis(false)
      onPublished(post)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not publish your post. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 rounded-2xl border border-color bg-card-bg p-3 sm:p-4">
      <label htmlFor="feed-post-body" className="mb-2 block text-sm font-bold text-text-light">Share an update</label>
      <textarea
        id="feed-post-body"
        ref={textareaRef}
        value={body}
        onChange={event => setBody(event.target.value)}
        maxLength={2000}
        rows={3}
        placeholder="What would you like to share?"
        className="w-full resize-y rounded-xl border border-color bg-dark-bg px-3 py-2.5 text-sm leading-relaxed text-text-light placeholder:text-text-muted focus:border-[#8B0000]/70 focus:outline-none"
        data-testid="input-feed-post"
      />

      {files.length > 0 && (
        <div className={`mt-3 grid gap-2 ${mediaKind === 'image' && files.length > 1 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}>
          {files.map((file, index) => (
            <div key={`${file.name}-${file.size}-${index}`} className="relative overflow-hidden rounded-xl border border-color bg-black">
              {mediaKind === 'video'
                ? <video src={previews[index]} controls preload="metadata" className="h-40 w-full object-contain sm:h-48" />
                : <img src={previews[index]} alt={`Selected photo ${index + 1}`} className="h-40 w-full object-cover sm:h-48" />
              }
              <button
                type="button"
                onClick={() => { setFiles(current => current.filter((_, fileIndex) => fileIndex !== index)); if (files.length === 1) setMediaKind(null) }}
                aria-label={`Remove ${file.name}`}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white hover:bg-black"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {message && <p role="alert" className="mt-2 text-xs text-[#ff9d9d]">{message}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input ref={photoInputRef} type="file" accept={IMAGE_TYPES.join(',')} multiple className="sr-only" onChange={choosePhotos} aria-label="Choose photos" />
        <input ref={videoInputRef} type="file" accept={VIDEO_TYPES.join(',')} className="sr-only" onChange={chooseVideo} aria-label="Choose a video" />
        <button type="button" onClick={() => photoInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-color px-3 py-2 text-xs font-semibold text-text-muted hover:border-[#8B0000]/50 hover:text-text-light">
          <ImagePlus size={15} /> Photos
        </button>
        <button type="button" onClick={() => videoInputRef.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-color px-3 py-2 text-xs font-semibold text-text-muted hover:border-[#8B0000]/50 hover:text-text-light">
          <Video size={15} /> Video
        </button>
        <button type="button" onClick={() => setShowEmojis(value => !value)} aria-expanded={showEmojis} className="inline-flex items-center gap-1.5 rounded-lg border border-color px-3 py-2 text-xs font-semibold text-text-muted hover:border-[#8B0000]/50 hover:text-text-light">
          <Smile size={15} /> Emoji
        </button>
        <span className="ml-auto text-[10px] text-text-muted">{body.length}/2,000</span>
        <button type="submit" disabled={submitting || (!body.trim() && files.length === 0)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#8B0000] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#a00000] disabled:cursor-not-allowed disabled:opacity-50">
          {submitting ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />}
          {submitting ? 'Publishing…' : 'Post now'}
        </button>
      </div>
      {showEmojis && (
        <div className="mt-2 flex flex-wrap gap-1 rounded-xl border border-color bg-dark-bg p-2" aria-label="Emoji picker">
          {EMOJIS.map(emoji => (
            <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} aria-label={`Insert ${emoji}`} className="rounded-lg px-2 py-1.5 text-lg hover:bg-card-bg">
              {emoji}
            </button>
          ))}
        </div>
      )}
      <p className="mt-2 text-[10px] text-text-muted">Photos: up to four, 8 MB each. Videos: one, up to 30 MB.</p>
    </form>
  )
}
