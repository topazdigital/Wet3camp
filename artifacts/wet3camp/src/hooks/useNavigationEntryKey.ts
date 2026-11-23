import { useSyncExternalStore } from 'react'
import { getNavigationEntryKey, navigationPushEvent } from '@/lib/navigation-state'

function subscribe(onChange: () => void) {
  window.addEventListener('popstate', onChange)
  window.addEventListener(navigationPushEvent, onChange)
  window.addEventListener('replaceState', onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(navigationPushEvent, onChange)
    window.removeEventListener('replaceState', onChange)
  }
}

function getSnapshot() {
  return getNavigationEntryKey()
}

export function useNavigationEntryKey() {
  return useSyncExternalStore(subscribe, getSnapshot, () => 'server')
}
