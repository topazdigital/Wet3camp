export interface ScrollSnapshot {
  y: number
  savedAt: number
  anchorHref?: string
  anchorTop?: number
  anchorDocumentTop?: number
}

const ENTRY_KEY = '__wet3campNavigationEntry'
const HISTORY_PATCHED = '__wet3campNavigationPatched'
const ENTRY_PUSH_EVENT = 'wet3camp:navigation-push'
const STORAGE_PREFIX = 'wet3camp:navigation:v1:'
const ENTRY_LIST_KEY = `${STORAGE_PREFIX}entries`
const MAX_TRACKED_ENTRIES = 40

type ExtendedHistory = History & {
  [HISTORY_PATCHED]?: boolean
}

const pageState = new Map<string, unknown>()

function createEntryKey() {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)
  return `entry-${Date.now()}-${random}`
}

function keyFromState(state: unknown): string | null {
  if (!state || typeof state !== 'object') return null
  const key = (state as Record<string, unknown>)[ENTRY_KEY]
  return typeof key === 'string' ? key : null
}

function stateWithKey(state: unknown, key: string) {
  if (state && typeof state === 'object' && !Array.isArray(state)) {
    return { ...(state as Record<string, unknown>), [ENTRY_KEY]: key }
  }
  return { [ENTRY_KEY]: key, __wet3campOriginalHistoryState: state }
}

function readTrackedEntries(): string[] {
  try {
    const stored = window.sessionStorage.getItem(ENTRY_LIST_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function registerEntry(key: string) {
  try {
    const entries = readTrackedEntries().filter(entry => entry !== key)
    entries.push(key)

    while (entries.length > MAX_TRACKED_ENTRIES) {
      const expired = entries.shift()
      if (!expired) continue
      window.sessionStorage.removeItem(`${STORAGE_PREFIX}scroll:${expired}`)
      for (const cacheKey of pageState.keys()) {
        if (cacheKey.startsWith(`${expired}:`)) pageState.delete(cacheKey)
      }
    }

    window.sessionStorage.setItem(ENTRY_LIST_KEY, JSON.stringify(entries))
  } catch {
    // Scroll restoration remains available in memory when storage is unavailable.
  }
}

export function getNavigationEntryKey(): string {
  if (typeof window === 'undefined') return 'server'

  const existing = keyFromState(window.history.state)
  if (existing) return existing

  const key = createEntryKey()
  window.history.replaceState(stateWithKey(window.history.state, key), '', window.location.href)
  registerEntry(key)
  return key
}

export function initializeNavigationHistory() {
  if (typeof window === 'undefined') return

  const history = window.history as ExtendedHistory
  if (!history[HISTORY_PATCHED]) {
    const pushState = history.pushState.bind(history)
    const replaceState = history.replaceState.bind(history)

    history.pushState = (state: unknown, unused: string, url?: string | URL | null) => {
      const key = createEntryKey()
      const result = pushState(stateWithKey(state, key), unused, url)
      registerEntry(key)
      window.dispatchEvent(new Event(ENTRY_PUSH_EVENT))
      return result
    }

    history.replaceState = (state: unknown, unused: string, url?: string | URL | null) => {
      const key = keyFromState(state) ?? keyFromState(window.history.state) ?? createEntryKey()
      const result = replaceState(stateWithKey(state, key), unused, url)
      registerEntry(key)
      return result
    }

    Object.defineProperty(history, HISTORY_PATCHED, { value: true })
  }

  getNavigationEntryKey()
}

export function readNavigationPageState<T>(section: string): T | null {
  const cacheKey = `${getNavigationEntryKey()}:${section}`
  return (pageState.get(cacheKey) as T | undefined) ?? null
}

export function writeNavigationPageState(section: string, value: unknown) {
  const cacheKey = `${getNavigationEntryKey()}:${section}`
  pageState.set(cacheKey, value)
}

export function readScrollSnapshot(entryKey: string): ScrollSnapshot | null {
  try {
    const stored = window.sessionStorage.getItem(`${STORAGE_PREFIX}scroll:${entryKey}`)
    if (!stored) return null
    const snapshot = JSON.parse(stored) as ScrollSnapshot
    if (typeof snapshot.y !== 'number' || !Number.isFinite(snapshot.y)) return null
    if (Date.now() - snapshot.savedAt > 4 * 60 * 60 * 1000) return null
    return snapshot
  } catch {
    return null
  }
}

export function writeScrollSnapshot(entryKey: string, snapshot: ScrollSnapshot) {
  try {
    window.sessionStorage.setItem(
      `${STORAGE_PREFIX}scroll:${entryKey}`,
      JSON.stringify(snapshot),
    )
  } catch {
    // The app should continue to work if session storage is full or disabled.
  }
}

export const navigationPushEvent = ENTRY_PUSH_EVENT
