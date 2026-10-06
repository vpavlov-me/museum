import { useSyncExternalStore } from 'react'
import { museumEvent } from './events'
import { getExhibition, type ExhibitionId, type ExhibitionRooms } from './exhibitions'

/*
 * Exhibition-level code splitting. An exhibition's rooms are fetched the first time
 * the visitor heads for it (approaching its door, a direct link, choosing it on the
 * tour), mounted, and their shaders compiled; only then does its door open. Loaded
 * exhibitions stay for the rest of the session: rooms out of sight already cost nothing.
 *
 *   idle → loading (fetching the chunk) → mounted (compiling) → open
 */

export type LoadStatus = 'idle' | 'loading' | 'mounted' | 'open'

let status: Record<string, LoadStatus> = {}
const modules = new Map<ExhibitionId, ExhibitionRooms>()
const listeners = new Set<() => void>()

function set(id: ExhibitionId, next: LoadStatus) {
  status = { ...status, [id]: next }
  listeners.forEach((listener) => listener())
}

export const exhibitions = {
  status: (id: ExhibitionId): LoadStatus => status[id] ?? 'idle',
  rooms: (id: ExhibitionId) => modules.get(id) ?? null,
  /** Starts fetching an exhibition's rooms, once. */
  request(id: ExhibitionId) {
    const exhibition = getExhibition(id)
    if (!exhibition?.load || exhibitions.status(id) !== 'idle') return
    set(id, 'loading')
    const started = performance.now()
    exhibition
      .load()
      .then((module) => {
        modules.set(id, module.default)
        set(id, 'mounted')
        museumEvent('exhibition_loaded', { id, ms: Math.round(performance.now() - started) })
      })
      // A failed fetch (offline, a deploy in between) leaves the door shut and can be retried.
      .catch(() => set(id, 'idle'))
  },
  /** Its rooms are mounted and compiled: the door may open. */
  opened(id: ExhibitionId) {
    if (exhibitions.status(id) === 'mounted') set(id, 'open')
  },
  /** Which exhibitions are loaded, for the profile readout. */
  loaded: () => [...modules.keys()],
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useExhibitionStatus(id: ExhibitionId) {
  return useSyncExternalStore(exhibitions.subscribe, () => exhibitions.status(id))
}

/** Every exhibition's status at once (a new object only when one changes). */
export function useExhibitionStatuses() {
  return useSyncExternalStore(exhibitions.subscribe, () => status)
}
