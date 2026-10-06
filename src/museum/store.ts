import { useSyncExternalStore } from 'react'
import { cellAt, SPAWN, spaceAt, zoneAt } from './roomRegistry'
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
  /** Which of the space's cells (bounds rectangles) the visitor is in: what can be seen depends on it. */
  cell: number
  focus: FocusInfo | null
  /** The visitor has left through the exit: the visit is over until they start another. */
  ended: boolean
  /** Exhibitions entered this session, for the plan and the lobby signs. Kept across visits. */
  visited: readonly string[]
}

const initial: MuseumState = { spaceId: SPAWN.spaceId, zoneId: null, cell: 0, focus: null, ended: false, visited: [] }
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
    museumStore.set({ ...initial, visited: state.visited })
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
/** Where the visitor stands, world [x, z]: read by the plan when it opens, never rendered from. */
export const visitor = { x: SPAWN.position[0], z: SPAWN.position[2] }

export function trackVisitor(x: number, z: number) {
  visitor.x = x
  visitor.z = z
  const space = spaceAt(x, z)
  if (!space) return
  const zoneId = zoneAt(space, x, z)?.id ?? null
  const cell = Math.max(0, cellAt(space, x, z))
  if (space.id !== state.spaceId || zoneId !== state.zoneId || cell !== state.cell) museumStore.set({ spaceId: space.id, zoneId, cell })
}
