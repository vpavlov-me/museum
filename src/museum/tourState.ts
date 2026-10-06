import { useSyncExternalStore } from 'react'
import { TOUR } from './tour'

type TourState = {
  /** The stop the visitor is at, or walking to. */
  index: number
  moving: boolean
  /** The last attempt to move on was stopped by something closed (a gate, an unloaded door). */
  blocked: boolean
  /** A stop the visitor has asked to go to; the tour picks it up on the next frame. */
  request: number | null
}

const initial: TourState = { index: 0, moving: false, blocked: false, request: null }
let state = initial
const listeners = new Set<() => void>()

function set(patch: Partial<TourState>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export const tour = {
  get: () => state,
  set,
  next() {
    if (!state.moving && state.index < TOUR.length - 1) set({ request: state.index + 1, blocked: false })
  },
  previous() {
    if (!state.moving && state.index > 0) set({ request: state.index - 1, blocked: false })
  },
  reset() {
    set(initial)
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export function useTour<T>(selector: (state: TourState) => T): T {
  return useSyncExternalStore(tour.subscribe, () => selector(state))
}
