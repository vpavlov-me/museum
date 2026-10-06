import { useSyncExternalStore } from 'react'
import { SPAWN, spaceAt, zoneAt } from './roomRegistry'
import type { ExhibitCardData } from './types'

export type FocusInfo = {
  id: string
  card: ExhibitCardData | null
  /** True when the card's text is already written in the space next to the object. */
  labelled: boolean
  /** Verb shown next to the E key, or null when the object is not interactive right now. */
  prompt: string | null
}

type MuseumState = {
  /** Space the visitor is physically standing in. */
  spaceId: string
  /** Named part of that space (a state, a chapter), or null. */
  zoneId: string | null
  focus: FocusInfo | null
  /** The visitor has left through the exit: the visit is over until they start another. */
  ended: boolean
}

const initial: MuseumState = { spaceId: SPAWN.spaceId, zoneId: null, focus: null, ended: false }
let state: MuseumState = initial
const listeners = new Set<() => void>()

/**
 * Tiny shared state between the 3D scene (writer) and 2D overlays and rooms (readers).
 * The scene writes only when a value actually changes, never every frame.
 */
export const museumStore = {
  get: () => state,
  /** Back to the state of a fresh visit. */
  reset() {
    museumStore.set(initial)
  },
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

/**
 * Records where the visitor is standing. Inside a doorway no space matches,
 * so the previous space and zone are kept.
 */
export function trackVisitor(x: number, z: number) {
  const space = spaceAt(x, z)
  if (!space) return
  const zoneId = zoneAt(space, x, z)?.id ?? null
  if (space.id !== state.spaceId || zoneId !== state.zoneId) museumStore.set({ spaceId: space.id, zoneId })
}
