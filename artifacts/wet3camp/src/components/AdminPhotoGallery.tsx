import { useCallback, useEffect, useState } from 'react'
import { proxyImg } from '@/lib/proxyImg'

type PhotoRecord = {
  photo_type: 'gallery' | 'profile'
  photo_id: string | null
  escort_id: string
  escort_name: string
  city: string | null
  source_site: string | null
  image_url: string
  is_profile: boolean
}

type AdminFetch = (path: string, opts?: RequestInit) => Promise<any>

const PAGE_SIZE = 60
const MAX_BULK_DELETE = 500

function photoKey(photo: PhotoRecord) {
  return `${photo.photo_type}:${photo.escort_id}:${photo.photo_id ?? 'profile'}`
}

export default function AdminPhotoGallery({ adminFetch }: { adminFetch: AdminFetch }) {
  const [photos, setPhotos] = useState<PhotoRecord[]>([])
  const [selected, setSelected] = useState<Record<string, PhotoRecord>>({})
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      })
      if (search.trim()) params.set('q', search.trim())
      const result = await adminFetch(`/admin/photo-gallery?${params.toString()}`)
      setPhotos(Array.isArray(result?.data) ? result.data : [])
      setTotal(Number(result?.total ?? 0))
    } catch (err: any) {
      setError(err?.message || 'Could not load escort photos.')
      setPhotos([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [adminFetch, page, search])

  useEffect(() => { void load() }, [load])

  const togglePhoto = (photo: PhotoRecord) => {
    const key = photoKey(photo)
    if (!selected[key] && selectedCount >= MAX_BULK_DELETE) {
      setError(`Select no more than ${MAX_BULK_DELETE} photos per deletion batch.`)
      return
    }
    setSelected(current => {
      const next = { ...current }
      if (next[key]) delete next[key]
      else next[key] = photo
      return next
    })
    setMessage('')
  }

  const pageIsSelected = photos.length > 0 && photos.every(photo => selected[photoKey(photo)])
  const togglePage = () => {
    const willExceedLimit = !pageIsSelected &&
      selectedCount + photos.filter(photo => !selected[photoKey(photo)]).length > MAX_BULK_DELETE
    setSelected(current => {
      const next = { ...current }
      if (pageIsSelected) photos.forEach(photo => delete next[photoKey(photo)])
      else {
        let available = Math.max(0, MAX_BULK_DELETE - Object.keys(next).length)
        photos.forEach(photo => {
          const key = photoKey(photo)
          if (next[key]) return
          if (available > 0) {
            next[key] = photo
            available--
          }
        })
      }
      return next
    })
    if (willExceedLimit) setError(`You can select up to ${MAX_BULK_DELETE} photos per deletion batch.`)
    else setError('')
    setMessage('')
  }

  const deleteSelected = async () => {
    const items = Object.values(selected)
    if (!items.length) return
    const confirmed = window.confirm(
      `Permanently remove ${items.length} selected photo${items.length === 1 ? '' : 's'} from escort profiles and galleries? Any profile left without another photo will use the Wet3Camp logo. This cannot be undone.`,
    )
    if (!confirmed) return

    setDeleting(true)
    setError('')
    setMessage('')
    try {
      const result = await adminFetch('/admin/photo-gallery/delete', {
        method: 'POST',
        body: JSON.stringify({
          items: items.map(photo => ({
            photo_type: photo.photo_type,
            photo_id: photo.photo_id,
            escort_id: photo.escort_id,
            image_url: photo.image_url,
          })),
        }),
      })
      const deleted = Number(result?.deleted ?? 0)
      const skipped = Number(result?.skipped ?? 0)
      setSelected({})
      setMessage(
        `Removed ${deleted} photo${deleted === 1 ? '' : 's'}${skipped ? `; ${skipped} changed before deletion and were skipped` : ''}.`,
      )

      const nextPage = Math.min(page, Math.max(0, Math.ceil(Math.max(total - deleted, 0) / PAGE_SIZE) - 1))
      setTotal(value => Math.max(0, value - deleted))
      if (nextPage !== page) setPage(nextPage)
      else await load()
    } catch (err: any) {
      setError(err?.message || 'Could not delete the selected photos.')
    } finally {
      setDeleting(false)
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const selectedCount = Object.keys(selected).length

  return (
    <section className="space-y-4" aria-labelledby="admin-photo-gallery-title">
      <div className="flex flex-col gap-3 rounded-2xl border border-color bg-card-bg p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="admin-photo-gallery-title" className="text-sm font-bold text-text-light">Escort photo gallery</h2>
          <p className="mt-1 text-[11px] text-text-muted">
            {total.toLocaleString()} photos across all profiles, including imported listings. Profiles without a photo use the Wet3Camp logo.
          </p>
        </div>
        <button
          type="button"
          data-testid="button-delete-selected-photos"
          onClick={deleteSelected}
          disabled={!selectedCount || deleting || loading}
          className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 px-3 py-2 text-xs font-bold text-[#EF4444] transition-colors hover:bg-[#EF4444]/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Deleting…' : `Delete selected${selectedCount ? ` (${selectedCount})` : ''}`}
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex min-h-10 flex-1 items-center rounded-xl border border-color bg-dark-bg px-3">
          <span className="sr-only">Search photos by escort, city, or import source</span>
          <input
            data-testid="input-photo-gallery-search"
            type="search"
            value={search}
            onChange={event => { setSearch(event.target.value); setPage(0); setMessage('') }}
            placeholder="Search escort, city, or import source…"
            className="w-full bg-transparent py-2 text-sm text-text-light outline-none placeholder:text-text-muted/60"
          />
        </label>
        <label className="flex min-h-10 items-center gap-2 rounded-xl border border-color bg-card-bg px-3 text-xs text-text-muted">
          <input
            data-testid="checkbox-select-photo-page"
            type="checkbox"
            checked={pageIsSelected}
            disabled={!photos.length || loading || deleting}
            onChange={togglePage}
            className="h-4 w-4 accent-[#8B0000]"
          />
          Select all on this page
        </label>
      </div>

      {error && <p role="alert" data-testid="status-photo-gallery-error" className="rounded-xl border border-[#EF4444]/20 bg-[#EF4444]/10 p-3 text-xs text-[#EF4444]">{error}</p>}
      {message && <p role="status" data-testid="status-photo-gallery-result" className="rounded-xl border border-[#28a745]/20 bg-[#28a745]/10 p-3 text-xs text-[#28a745]">{message}</p>}

      {loading ? (
        <div role="status" data-testid="status-photo-gallery-loading" className="rounded-2xl border border-color bg-card-bg py-14 text-center text-xs text-text-muted">
          Loading escort photos…
        </div>
      ) : photos.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
          {photos.map(photo => {
            const key = photoKey(photo)
            const isSelected = Boolean(selected[key])
            const imageSrc = proxyImg(photo.image_url, 480) || '/icon-512.png'
            return (
              <article
                key={key}
                data-testid={`card-escort-photo-${photo.photo_type}-${photo.photo_id ?? photo.escort_id}`}
                className={`overflow-hidden rounded-xl border bg-card-bg transition-colors ${isSelected ? 'border-[#FFD700]/70 ring-1 ring-[#FFD700]/30' : 'border-color'}`}
              >
                <label className="relative block cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label={`Select photo for ${photo.escort_name}`}
                    data-testid={`checkbox-escort-photo-${photo.photo_type}-${photo.photo_id ?? photo.escort_id}`}
                    checked={isSelected}
                    disabled={deleting || (!isSelected && selectedCount >= MAX_BULK_DELETE)}
                    onChange={() => togglePhoto(photo)}
                    className="absolute left-2.5 top-2.5 z-10 h-5 w-5 accent-[#8B0000]"
                  />
                  <img
                    src={imageSrc}
                    alt={`${photo.escort_name} profile photo`}
                    loading="lazy"
                    decoding="async"
                    onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = '/icon-512.png' }}
                    className="aspect-square w-full bg-dark-bg object-cover"
                  />
                </label>
                <div className="space-y-1 p-2.5">
                  <p data-testid={`text-escort-photo-name-${photo.photo_type}-${photo.photo_id ?? photo.escort_id}`} className="truncate text-xs font-semibold text-text-light" title={photo.escort_name}>
                    {photo.escort_name || `Escort #${photo.escort_id}`}
                  </p>
                  <p className="truncate text-[10px] text-text-muted">
                    {photo.city || 'Location not recorded'}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {photo.is_profile && <span className="rounded bg-[#FFD700]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#FFD700]">Profile picture</span>}
                    <span className="rounded bg-dark-bg px-1.5 py-0.5 text-[9px] text-text-muted">
                      {photo.source_site ? `Imported · ${photo.source_site}` : photo.photo_type === 'gallery' ? 'Gallery photo' : 'Profile photo'}
                    </span>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div data-testid="status-photo-gallery-empty" className="rounded-2xl border border-dashed border-color bg-card-bg py-14 text-center">
          <p className="text-sm font-semibold text-text-light">{search ? 'No photos match this search.' : 'No escort photos found.'}</p>
          <p className="mt-1 text-xs text-text-muted">Profile pictures and gallery photos appear here.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span data-testid="text-photo-gallery-page">
          {total ? `${(page * PAGE_SIZE + 1).toLocaleString()}–${Math.min((page + 1) * PAGE_SIZE, total).toLocaleString()} of ${total.toLocaleString()}` : '0 photos'}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-testid="button-photo-gallery-previous"
            onClick={() => setPage(value => Math.max(0, value - 1))}
            disabled={page === 0 || loading || deleting}
            className="min-h-9 rounded-lg border border-color bg-card-bg px-3 text-text-light disabled:opacity-40"
          >
            Previous
          </button>
          <span aria-live="polite">Page {page + 1} of {pageCount}</span>
          <button
            type="button"
            data-testid="button-photo-gallery-next"
            onClick={() => setPage(value => Math.min(pageCount - 1, value + 1))}
            disabled={page >= pageCount - 1 || loading || deleting}
            className="min-h-9 rounded-lg border border-color bg-card-bg px-3 text-text-light disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  )
}
