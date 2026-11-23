import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import {
  getNavigationEntryKey,
  initializeNavigationHistory,
  navigationPushEvent,
  readScrollSnapshot,
  writeScrollSnapshot,
  type ScrollSnapshot,
} from '@/lib/navigation-state'

const RESTORE_TIMEOUT_MS = 8000

function normalizedHref(anchor: HTMLAnchorElement) {
  const url = new URL(anchor.href, window.location.href)
  return `${url.pathname}${url.search}${url.hash}`
}

function isContentAnchor(anchor: HTMLAnchorElement) {
  if (!anchor.closest('#root') || anchor.closest('aside, nav, header, footer, [role="navigation"]')) {
    return false
  }

  let current: HTMLElement | null = anchor
  while (current && current !== document.body) {
    const position = window.getComputedStyle(current).position
    if (position === 'fixed' || position === 'sticky') return false
    current = current.parentElement
  }
  return true
}

function findSavedAnchor(snapshot: ScrollSnapshot) {
  if (!snapshot.anchorHref) return null

  const candidates = Array.from(document.querySelectorAll('#root a[href]'))
    .filter((item): item is HTMLAnchorElement => item instanceof HTMLAnchorElement)
    .filter(isContentAnchor)
    .filter(anchor => normalizedHref(anchor) === snapshot.anchorHref)

  if (candidates.length === 0) return null
  if (typeof snapshot.anchorDocumentTop !== 'number') return candidates[0]

  return candidates.reduce((best, candidate) => {
    const candidateTop = window.scrollY + candidate.getBoundingClientRect().top
    const bestTop = window.scrollY + best.getBoundingClientRect().top
    return Math.abs(candidateTop - snapshot.anchorDocumentTop!) <
      Math.abs(bestTop - snapshot.anchorDocumentTop!)
      ? candidate
      : best
  })
}

function restoreSnapshot(snapshot: ScrollSnapshot, onFinish: () => void) {
  let cancelled = false
  let restoringAnchor = false
  const startedAt = Date.now()
  let intervalId: number | undefined
  let timeoutId: number | undefined
  let resizeObserver: ResizeObserver | undefined
  let mutationObserver: MutationObserver | undefined

  const cleanup = () => {
    cancelled = true
    if (intervalId !== undefined) window.clearInterval(intervalId)
    if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    resizeObserver?.disconnect()
    mutationObserver?.disconnect()
    window.removeEventListener('load', tryRestore, true)
  }

  const finish = () => {
    cleanup()
    onFinish()
  }

  const tryRestore = () => {
    if (cancelled || restoringAnchor) return

    const anchor = findSavedAnchor(snapshot)
    if (anchor) {
      restoringAnchor = true
      const placeAnchor = () => {
        if (cancelled) return
        const current = findSavedAnchor(snapshot) ?? anchor
        const anchorTop = snapshot.anchorTop ?? 0
        window.scrollTo(0, Math.max(
          0,
          window.scrollY + current.getBoundingClientRect().top - anchorTop,
        ))
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(finish)
        })
      }
      placeAnchor()
      return
    }

    const elapsed = Date.now() - startedAt
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
    if (!snapshot.anchorHref && maxScroll >= snapshot.y) {
      window.scrollTo(0, snapshot.y)
      finish()
      return
    }

    if (elapsed >= RESTORE_TIMEOUT_MS) {
      // If the old item no longer exists, stay at the top instead of jumping to a footer.
      finish()
    }
  }

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(tryRestore)
    resizeObserver.observe(document.documentElement)
  }
  if (typeof MutationObserver !== 'undefined' && document.body) {
    mutationObserver = new MutationObserver(tryRestore)
    mutationObserver.observe(document.body, { childList: true, subtree: true })
  }

  window.addEventListener('load', tryRestore, true)
  intervalId = window.setInterval(tryRestore, 120)
  timeoutId = window.setTimeout(tryRestore, RESTORE_TIMEOUT_MS)
  tryRestore()

  return cleanup
}

export default function ScrollRestoration() {
  const [location] = useLocation()
  const [navigationRevision, setNavigationRevision] = useState(0)
  const lastLocation = useRef(location)
  const activeEntryKey = useRef<string | null>(null)
  const pendingPopKey = useRef<string | null>(null)
  const pendingPushKey = useRef<string | null>(null)
  const cancelRestore = useRef<(() => void) | null>(null)

  useLayoutEffect(() => {
    const previousScrollRestoration = window.history.scrollRestoration
    initializeNavigationHistory()
    window.history.scrollRestoration = 'manual'
    activeEntryKey.current = getNavigationEntryKey()
    const initialSnapshot = readScrollSnapshot(activeEntryKey.current)
    if (initialSnapshot) {
      window.scrollTo(0, 0)
      cancelRestore.current = restoreSnapshot(initialSnapshot, () => {
        cancelRestore.current = null
      })
    }

    return () => {
      cancelRestore.current?.()
      cancelRestore.current = null
      window.history.scrollRestoration = previousScrollRestoration
    }
  }, [])

  useLayoutEffect(() => {
    const entryKey = getNavigationEntryKey()
    const locationChanged = lastLocation.current !== location
    const isBackOrForward = pendingPopKey.current === entryKey
    const isNewHistoryEntry = pendingPushKey.current === entryKey

    if (!locationChanged && !isBackOrForward && !isNewHistoryEntry) return

    lastLocation.current = location
    activeEntryKey.current = entryKey
    pendingPopKey.current = null
    pendingPushKey.current = null
    cancelRestore.current?.()
    cancelRestore.current = null

    if (isBackOrForward) {
      window.scrollTo(0, 0)
      const snapshot = readScrollSnapshot(entryKey)
      if (snapshot) {
        cancelRestore.current = restoreSnapshot(snapshot, () => {
          cancelRestore.current = null
        })
      }
      return
    }

    window.scrollTo(0, 0)
  }, [location, navigationRevision])

  useLayoutEffect(() => {
    const saveCurrentPosition = () => {
      const entryKey = activeEntryKey.current
      if (!entryKey) return
      writeScrollSnapshot(entryKey, {
        y: window.scrollY,
        savedAt: Date.now(),
      })
    }

    let saveTimer: number | undefined
    const onScroll = () => {
      if (saveTimer !== undefined) return
      saveTimer = window.setTimeout(() => {
        saveTimer = undefined
        saveCurrentPosition()
      }, 100)
    }

    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin || url.href === window.location.href) return
      if (cancelRestore.current) return

      if (saveTimer !== undefined) {
        window.clearTimeout(saveTimer)
        saveTimer = undefined
      }
      const contentAnchor = isContentAnchor(anchor)
      writeScrollSnapshot(activeEntryKey.current ?? getNavigationEntryKey(), {
        y: window.scrollY,
        savedAt: Date.now(),
        ...(contentAnchor ? {
          anchorHref: normalizedHref(anchor),
          anchorTop: anchor.getBoundingClientRect().top,
          anchorDocumentTop: window.scrollY + anchor.getBoundingClientRect().top,
        } : {}),
      })
    }

    const onPopState = () => {
      if (activeEntryKey.current) saveCurrentPosition()
      if (saveTimer !== undefined) {
        window.clearTimeout(saveTimer)
        saveTimer = undefined
      }
      pendingPopKey.current = getNavigationEntryKey()
      setNavigationRevision(revision => revision + 1)
    }

    const onPushState = () => {
      pendingPushKey.current = getNavigationEntryKey()
      setNavigationRevision(revision => revision + 1)
    }

    const cancelForUserInput = () => {
      cancelRestore.current?.()
      cancelRestore.current = null
    }

    const cancelForScrollingKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) {
        cancelRestore.current?.()
        cancelRestore.current = null
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('popstate', onPopState)
    window.addEventListener(navigationPushEvent, onPushState)
    window.addEventListener('beforeunload', saveCurrentPosition)
    window.addEventListener('wheel', cancelForUserInput, { passive: true })
    window.addEventListener('touchmove', cancelForUserInput, { passive: true })
    window.addEventListener('keydown', cancelForScrollingKey)
    document.addEventListener('click', onClick, true)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener(navigationPushEvent, onPushState)
      window.removeEventListener('beforeunload', saveCurrentPosition)
      window.removeEventListener('wheel', cancelForUserInput)
      window.removeEventListener('touchmove', cancelForUserInput)
      window.removeEventListener('keydown', cancelForScrollingKey)
      document.removeEventListener('click', onClick, true)
      if (saveTimer !== undefined) window.clearTimeout(saveTimer)
      cancelRestore.current?.()
      cancelRestore.current = null
    }
  }, [])

  return null
}
