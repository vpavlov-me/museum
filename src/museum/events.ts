/*
 * The museum's events, for analytics later: what a visitor does, never how they move.
 * Nothing is sent anywhere. Each event is dispatched on window as `museum:event` (for
 * whatever observes the page) and logged in development and profile builds.
 */

export type MuseumEventName =
  | 'museum_entered'
  | 'visit_mode_selected'
  | 'exhibition_loaded'
  | 'exhibition_entered'
  | 'exhibition_completed'
  | 'map_opened'
  | 'museum_left'

const LOG = import.meta.env.DEV || import.meta.env.MODE === 'profile'

export function museumEvent(name: MuseumEventName, data: Record<string, string | number | boolean> = {}) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('museum:event', { detail: { name, ...data } }))
  if (LOG) console.debug('[museum]', name, data)
}
