import { useSyncExternalStore } from 'react'
import { museumEvent } from './events'
import { exhibitionFromPath, getExhibition, pathOf, type ExhibitionId } from './exhibitions'
import { SPAWN } from './roomRegistry'
import { museumStore } from './store'

/*
 * Moving between the museum's parts. Walking does most of it; three things do not:
 *
 *   - a visit that starts from a direct link begins at that exhibition's first room;
 *   - every exhibition ends at a door back to the lobby, which brings the visitor
 *     there in one step (a short fade, then standing in front of that exhibition's
 *     entrance), instead of walking back through every room;
 *   - the lobby's front door leaves the museum.
 */

export type Place = { x: number; z: number; yaw: number }

const LOBBY_START: Place = { x: SPAWN.position[0], z: SPAWN.position[2], yaw: 0 }
const FADE_MS = 450
/** What a visitor coming back into the lobby turns towards: its middle, and the front door beyond. */
const LOBBY_MIDDLE = [1, 33.5] as const

/** Where a visit starts: the lobby, or the exhibition the URL names. */
let target: ExhibitionId | null = typeof window === 'undefined' ? null : exhibitionFromPath(window.location.pathname)
/** A move the visitor (or the tour) should make on its next frame. */
let pending: (Place & { lobby: boolean }) | null = null
let fading = false
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

function setFading(value: boolean) {
  fading = value
  notify()
}

export const navigation = {
  /** The exhibition this visit was asked to start in, if any. */
  get target() {
    return target
  },
  /** Where the visitor stands when a visit begins. */
  start(): Place {
    const exhibition = target ? getExhibition(target) : null
    return exhibition ? { x: exhibition.start.at[0], z: exhibition.start.at[1], yaw: exhibition.start.yaw } : LOBBY_START
  },
  /** Visiting again starts in the lobby, whatever the first visit's link said. */
  startInLobby() {
    target = null
    window.history.replaceState(null, '', '/')
  },
  /** Taken once by whoever moves the camera (the visitor, or the tour). */
  takeMove() {
    const move = pending
    pending = null
    return move
  },
  get fading() {
    return fading
  },
  /**
   * Back to the lobby: a short fade, then standing in front of that exhibition's entrance,
   * facing into the lobby. From an exhibition's last door, the exhibition is complete.
   */
  returnToLobby(from: ExhibitionId, completed = true) {
    if (fading) return
    if (completed) museumEvent('exhibition_completed', { id: from })
    setFading(true)
    window.setTimeout(() => {
      // Just inside the lobby, in front of that exhibition's entrance, turned towards the middle of the lobby.
      const door = getExhibition(from)?.door ?? 0
      const z = 27.8
      pending = { x: door, z, yaw: Math.atan2(-(LOBBY_MIDDLE[0] - door), -(LOBBY_MIDDLE[1] - z)), lobby: true }
      window.setTimeout(() => setFading(false), 120)
    }, FADE_MS)
  },
  /** Through the front door: the visit ends. */
  leave() {
    museumEvent('museum_left')
    museumStore.set({ ended: true })
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export const useFading = () => useSyncExternalStore(navigation.subscribe, () => fading)

/** Keeps the address bar on the exhibition the visitor is in, so it can be shared or reloaded. */
export function syncPath(exhibition: ExhibitionId | null) {
  const path = pathOf(exhibition)
  if (window.location.pathname !== path) window.history.replaceState(null, '', path)
}
