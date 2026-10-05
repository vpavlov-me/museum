import { useSyncExternalStore } from 'react'
import { SPAWN } from './roomRegistry'
import type { ExhibitCardData } from './types'

export type FocusInfo = {
  id: string
  card: ExhibitCardData | null
  /** Verb shown next to the E key, or null when the object is not interactive right now. */
  prompt: string | null
}

type MuseumState = {
  /** Space the visitor is physically standing in. */
  spaceId: string
  focus: FocusInfo | null
}

let state: MuseumState = { spaceId: SPAWN.spaceId, focus: null }
const listeners = new Set<() => void>()

/**
 * Tiny shared state between the 3D scene (writer) and 2D overlays and rooms (readers).
 * The scene writes only when a value actually changes, never every frame.
 */
export const museumStore = {
  get: () => state,
  set(patch: Partial<MuseumState>) {
    state = { ...state, ...patch }
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useMuseumStore<T>(selector: (state: MuseumState) => T): T {
  return useSyncExternalStore(museumStore.subscribe, () => selector(museumStore.get()))
}
