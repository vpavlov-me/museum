import { inArchaeology, inDark } from './roomRegistry'

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

/** Dark Patterns is authored from its door in the lobby. */
const dk = (x: number, z: number): [number, number] => {
  const point = inDark(x, z)
  return [point.x, point.z]
}
const S = Math.PI

export type Route = 'lobby' | 'permanent' | 'archaeology' | 'dark-patterns'

/** The lobby: one stop, facing the three entrances, where an exhibition is chosen. */
const LOBBY: TourStop[] = [{ id: 'lobby', title: 'Lobby', at: [1, 33.2], yaw: N }]

const PERMANENT: TourStop[] = [
  // Entrance
  { id: 'entrance', title: 'Permanent Exhibition', at: [0, 24.6], yaw: N, via: [[0, 27.4]] },
  { id: 'statement', title: 'Objects, conventions, states', at: [0.6, 20.6], yaw: W },
  // 01 The Button
  { id: 'button-room', title: 'The Button', at: [0, 12.2], yaw: N },
  { id: 'button-1995', title: '1995, the raised button', at: [2, 10.3], yaw: E },
  { id: 'button-2007', title: '2007, the tactile button', at: [-2, 6.4], yaw: W },
  { id: 'button-2013', title: '2013, the flat button', at: [-2, 2.4], yaw: W },
  { id: 'button-2026', title: '2026, the quiet button', at: [2, -1.6], yaw: E },
  // Passage
  { id: 'passage', title: 'Towards Room 02', at: [0, -7.2], yaw: N, via: [[0, -3.2]] },
  // 02 Things We Somehow Accepted
  { id: 'accepted', title: 'Things We Somehow Accepted', at: [-6.9, -12.1], yaw: -0.45, via: [[0, -9.5], [-6.9, -9.5]] },
  { id: 'banner', title: 'The cookie banner', at: [-1.6, -14.8], yaw: -0.2 },
  { id: 'modals', title: 'The modal', at: [1.6, -20.4], yaw: 0.85, via: [[1.6, -14.8], [1.95, -17.3]] },
  { id: 'pause', title: 'Prove / attend', at: [-5.4, -29], yaw: N, via: [[1.6, -26.2], [-6.1, -26.2], [-6.1, -28.6]] },
  { id: 'badge', title: 'The notification badge', at: [-4.5, -33], yaw: N, via: [[-4.5, -31]] },
  { id: 'captcha', title: 'The CAPTCHA', at: [-6.9, -43], yaw: N, via: [[-7, -33.4]] },
  { id: 'skeleton', title: 'The skeleton screen', at: [-5.4, -48.2], yaw: -0.9, via: [[-6.9, -46.4]] },
  { id: 'feed', title: 'Infinite scroll', at: [-6.9, -60.4], yaw: N, via: [[-5.6, -51], [-6.9, -52.2]] },
  { id: 'feed-end', title: "You're all caught up", at: [-6.9, -75], yaw: N },
  // 03 Interface States
  { id: 'states', title: 'Interface States', at: [-1.5, -87.2], yaw: N, via: [[-6.9, -83.6], [0.1, -83.6], [0.1, -85.9]] },
  { id: 'loading', title: 'I. Loading', at: [-6.3, -94.9], yaw: -0.35, via: [[-6.3, -90.4]] },
  { id: 'loading-door', title: 'Loading…', at: [-2.5, -102.9], yaw: N, via: [[-6.3, -99.4]] },
  { id: 'empty', title: 'II. Empty', at: [-2.5, -107.6], yaw: 0.15 },
  { id: 'empty-cta', title: 'Nothing here yet', at: [-4.65, -123.4], yaw: N },
  { id: 'error', title: 'III. Error', at: [-10.4, -128], yaw: N, via: [[-10.4, -124.4]] },
  { id: 'error-retry', title: 'Something went wrong', at: [-11.5, -137.6], yaw: N },
  { id: 'offline', title: 'IV. Offline', at: [-6.4, -142], yaw: N, via: [[-6.4, -138.4]] },
  { id: 'offline-node', title: 'Reconnect', at: [-3, -147], yaw: E + 0.25 },
  { id: 'success', title: 'V. Success', at: [-9.4, -157.4], yaw: N, via: [[-9.4, -152.8]] },
  // Colophon, and the way back
  { id: 'colophon', title: 'Thank you for visiting', at: [-10.2, -174], yaw: 0.15, via: [[-9.4, -168.8]] },
  { id: 'permanent-return', title: 'Back to the lobby', at: [-7.6, -176.3], yaw: N },
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

const DARK_PATTERNS: TourStop[] = [
  { id: 'dark-patterns', title: 'Dark Patterns', at: dk(-7, -10), yaw: N, via: [dk(0, 1.3), dk(0, -2), dk(0, -6.6), dk(-7, -6.6), dk(-7, -8.6)] },
  { id: 'countdown', title: 'This exhibition closes in…', at: dk(-4.4, -12.2), yaw: E },
  { id: 'checkout', title: 'II. Checkout', at: dk(-4, -17.4), yaw: N, via: [dk(-4, -14.2), dk(-4, -16)] },
  { id: 'stay', title: 'Thank you for staying', at: dk(-4.6, -22.6), yaw: N, via: [dk(-4.6, -19.8)] },
  { id: 'preselected', title: 'Booking protection', at: dk(-11, -18.2), yaw: S, via: [dk(-4.6, -19.8), dk(-10, -19.8)] },
  { id: 'receipt', title: 'The receipt', at: dk(-13.4, -19), yaw: N },
  { id: 'total', title: 'The total', at: dk(-16.4, -17.4), yaw: S },
  { id: 'leave-door', title: 'No thanks', at: dk(-18.6, -19.6), yaw: N + 0.5 },
  { id: 'flow-1', title: 'Are you sure?', at: dk(-10.2, -22.3), yaw: E, via: [dk(-18.9, -20.4), dk(-18.9, -22.3)] },
  { id: 'flow-2', title: 'Before you go', at: dk(-17.8, -24.7), yaw: W, via: [dk(-9, -22.3), dk(-9, -24.7)] },
  { id: 'flow-3', title: 'Tell us why', at: dk(-10.2, -27.1), yaw: E, via: [dk(-19, -24.7), dk(-19, -27.1)] },
  { id: 'flow-4', title: 'Please hold', at: dk(-17.8, -29.5), yaw: W, via: [dk(-9, -27.1), dk(-9, -29.5)] },
  { id: 'cancelled', title: 'IV. Cancelled', at: dk(-16.4, -33.6), yaw: N, via: [dk(-18.9, -29.5), dk(-18.9, -31.6)] },
  { id: 'dark-return', title: 'Back to the lobby', at: dk(-9.8, -34.4), yaw: N },
]

export const TOURS: Record<Route, TourStop[]> = { lobby: LOBBY, permanent: PERMANENT, archaeology: ARCHAEOLOGY, 'dark-patterns': DARK_PATTERNS }
