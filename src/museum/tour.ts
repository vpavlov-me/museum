import { inArchaeology } from './roomRegistry'

/*
 * The guided tour: authored walks through the same museum, for touch screens and for
 * anyone who prefers not to steer. One route per exhibition, chosen in the lobby; each
 * ends at that exhibition's door back to the lobby. Each stop is a place to stand and
 * a direction to face, in route order; `via` are the points walked through on the way
 * there (door centres, the way round a plinth), in world metres. An exhibition's first
 * stop walks from the lobby. Yaw 0 faces north (-z), positive turns left; pitch 0 is
 * level, negative looks down (into the trench).
 *
 * The tour walks the same floor as the visitor and is stopped by the same things:
 * a closed CAPTCHA gate or an unloaded doorway holds it until the room allows it.
 */

export type TourStop = {
  id: string
  title: string
  at: [number, number]
  yaw: number
  pitch?: number
  via?: [number, number][]
}

const N = 0
const W = Math.PI / 2
const E = -Math.PI / 2

/** Interface Archaeology is authored from its door in the lobby. */
const r4 = (x: number, z: number): [number, number] => {
  const point = inArchaeology(x, z)
  return [point.x, point.z]
}

export type Route = 'lobby' | 'permanent' | 'archaeology'

/** The lobby: one stop, facing the three entrances, where an exhibition is chosen. */
const LOBBY: TourStop[] = [{ id: 'lobby', title: 'Lobby', at: [1, 33.2], yaw: N }]

const PERMANENT: TourStop[] = [
  // Entrance
  { id: 'entrance', title: 'Permanent Exhibition', at: [0, 24.6], yaw: N, via: [[0, 27.4]] },
  { id: 'statement', title: 'Objects, conventions, states', at: [0.6, 20.6], yaw: W },
  // 01 The Button
  { id: 'button-room', title: 'The Button', at: [0, 11.5], yaw: N },
  { id: 'button-1995', title: '1995, the raised button', at: [3.4, 8.5], yaw: E },
  { id: 'button-2007', title: '2007, the tactile button', at: [-3.4, 2.5], yaw: W },
  { id: 'button-2013', title: '2013, the flat button', at: [-3.4, -3.5], yaw: W },
  { id: 'button-2026', title: '2026, the quiet button', at: [3.4, -10], yaw: E },
  // Passage
  { id: 'passage', title: 'Towards Room 02', at: [-6, -16.8], yaw: N, via: [[-6, -12.8]] },
  // 02 Things We Somehow Accepted
  { id: 'accepted', title: 'Things We Somehow Accepted', at: [-12.9, -21.7], yaw: -0.45, via: [[-6, -19.1], [-12.9, -19.1]] },
  { id: 'banner', title: 'The cookie banner', at: [-7.6, -24.4], yaw: -0.2 },
  { id: 'modals', title: 'The modal', at: [-4.4, -30], yaw: 0.85, via: [[-4.4, -24.4], [-4.05, -26.9]] },
  { id: 'pause', title: 'Prove / attend', at: [-11.4, -38.6], yaw: N, via: [[-4.4, -35.8], [-12.1, -35.8]] },
  { id: 'badge', title: 'The notification badge', at: [-10.5, -42.6], yaw: N, via: [[-10.5, -40.6]] },
  { id: 'captcha', title: 'The CAPTCHA', at: [-12.9, -52.6], yaw: N, via: [[-13, -43]] },
  { id: 'skeleton', title: 'The skeleton screen', at: [-11.4, -57.8], yaw: -0.9, via: [[-12.9, -56]] },
  { id: 'feed', title: 'Infinite scroll', at: [-12.9, -70], yaw: N, via: [[-11.6, -60.6], [-12.9, -61.8]] },
  { id: 'feed-end', title: "You're all caught up", at: [-12.9, -84.6], yaw: N },
  // 03 Interface States
  { id: 'states', title: 'Interface States', at: [-7.5, -96.8], yaw: N, via: [[-12.9, -93.2], [-5.9, -93.2], [-5.9, -95.5]] },
  { id: 'loading', title: 'I. Loading', at: [-12.3, -104.5], yaw: -0.35, via: [[-12.3, -100]] },
  { id: 'loading-door', title: 'Loading…', at: [-8.5, -112.5], yaw: N, via: [[-12.3, -109]] },
  { id: 'empty', title: 'II. Empty', at: [-8.5, -117.2], yaw: 0.15 },
  { id: 'empty-cta', title: 'Nothing here yet', at: [-10.65, -133], yaw: N },
  { id: 'error', title: 'III. Error', at: [-16.4, -137.6], yaw: N, via: [[-16.4, -134]] },
  { id: 'error-retry', title: 'Something went wrong', at: [-17.5, -147.2], yaw: N },
  { id: 'offline', title: 'IV. Offline', at: [-12.4, -151.6], yaw: N, via: [[-12.4, -148]] },
  { id: 'offline-node', title: 'Reconnect', at: [-9, -156.6], yaw: E + 0.25 },
  { id: 'success', title: 'V. Success', at: [-15.4, -167], yaw: N, via: [[-15.4, -162.4]] },
  // Colophon, and the way back
  { id: 'colophon', title: 'Thank you for visiting', at: [-16.2, -183.6], yaw: 0.15, via: [[-15.4, -178.4]] },
  { id: 'permanent-return', title: 'Back to the lobby', at: [-13.6, -185.9], yaw: N },
]

const ARCHAEOLOGY: TourStop[] = [
  { id: 'archaeology', title: 'Interface Archaeology', at: r4(6.4, -9.8), yaw: N, via: [r4(0, 1.3), r4(0, -2), r4(0, -6.6), r4(7, -6.6), r4(7, -8.6)] },
  { id: 'institute', title: 'Institute for Early Screens', at: r4(5.6, -11.4), yaw: W },
  { id: 'trench', title: 'II. The Trench', at: r4(11.6, -17), yaw: N + 0.35, via: [r4(10.5, -13.6), r4(10.5, -16.2)] },
  { id: 'seal', title: 'Seal of the hidden chamber', at: r4(10.5, -21.1), yaw: W, pitch: -0.55 },
  { id: 'tablet', title: 'Votive tablet', at: r4(10.5, -24.2), yaw: W, pitch: -0.6 },
  { id: 'arrowheads', title: 'Arrowheads', at: r4(10.5, -27.4), yaw: W, pitch: -0.65 },
  { id: 'store', title: 'III. The Store', at: r4(0, -35.4), yaw: N, via: [r4(11.2, -31.2), r4(0, -31.2)] },
  { id: 'inscriptions', title: 'Sealed inscriptions', at: r4(2.5, -35.7), yaw: N },
  { id: 'hoard', title: 'Token hoard', at: r4(2.5, -39.7), yaw: N, via: [r4(4.4, -36.6), r4(4.4, -39.7)] },
  { id: 'oath', title: 'The oath', at: r4(2.5, -43.7), yaw: N, via: [r4(4.4, -40.6), r4(4.4, -43.7)] },
  { id: 'reconstruction', title: 'IV. Reconstruction', at: r4(4.9, -50.6), yaw: W + 0.15, via: [r4(4.6, -44.6), r4(5, -46)] },
  { id: 'afterword', title: 'Not entirely wrong', at: r4(1.2, -55.6), yaw: N, via: [r4(5, -55.6)] },
  { id: 'archaeology-return', title: 'Back to the lobby', at: r4(5.3, -55.4), yaw: N },
]

export const TOURS: Record<Route, TourStop[]> = { lobby: LOBBY, permanent: PERMANENT, archaeology: ARCHAEOLOGY }
