import { useSyncExternalStore } from 'react'
import { exhibitions } from './exhibitionLoader'
import { TOURS, type Route } from './tour'

export type TourPlace = { route: Route; index: number }

type TourState = TourPlace & {
  moving: boolean
  /** The last attempt to move on was stopped by something closed (a gate, a door). */
  blocked: boolean
  /** Walking to an exhibition whose rooms are still loading: its door is shut for now. */
  waiting: boolean
  /** A stop the visitor has asked to go to; the tour picks it up on the next frame. */
  request: TourPlace | null
}

const initial: TourState = { route: 'lobby', index: 0, moving: false, blocked: false, waiting: false, request: null }
let state = initial
const listeners = new Set<() => void>()

function set(patch: Partial<TourState>) {
  state = { ...state, ...patch }
  listeners.forEach((listener) => listener())
}

export const tour = {
  get: () => state,
  set,
  /** The stop the visitor is at, or walking to. */
  stop: (place: TourPlace = state) => TOURS[place.route][place.index],
  next() {
    if (!state.moving && state.index < TOURS[state.route].length - 1) set({ request: { route: state.route, index: state.index + 1 }, blocked: false })
  },
  /** Back along the route; from an exhibition's first stop, back out to the lobby. */
  previous() {
    if (state.moving) return
    if (state.index > 0) set({ request: { route: state.route, index: state.index - 1 }, blocked: false })
    else if (state.route !== 'lobby') set({ request: { route: 'lobby', index: 0 }, blocked: false })
  },
  /** From the lobby: walk into an exhibition (its rooms start loading now, if they have not). */
  choose(route: Exclude<Route, 'lobby'>) {
    if (state.moving || state.route !== 'lobby') return
    exhibitions.request(route)
    set({ request: { route, index: 0 }, blocked: false })
  },
  reset(route: Route = 'lobby') {
    set({ ...initial, route })
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
