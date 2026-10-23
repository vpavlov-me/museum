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
  // The Button (#48): one hall straight off the lobby, walked clockwise in the essay's order:
  // each bay's chapter on the wall facing it, then its objects.
  { id: 'the-button', title: 'The Button', at: [0, 23.5], yaw: N, via: [[0, 27.4]] },
  { id: 'prologue', title: 'A button is a promise', at: [-8.5, 21.8], yaw: N },
  // I. Before the screen.
  { id: 'chapter-1', title: 'I. Before the screen', at: [-9.3, 10.4], yaw: E, via: [[-3.8, 19.5], [-3.8, 16.5], [-6.6, 16.2]] },
  { id: 'typewriter', title: '1878, the typewriter key', at: [-6.6, 15], yaw: W, pitch: -0.15 },
  { id: 'switch', title: '1884, the light switch', at: [-9.8, 12], yaw: W },
  { id: 'call', title: '1900s, the call button', at: [-6.6, 9], yaw: W, pitch: -0.1 },
  { id: 'doorbell', title: '1910s, the bell push', at: [-6.6, 5.4], yaw: W, pitch: -0.1 },
  // II. Drawing a press.
  { id: 'chapter-2', title: 'II. Drawing a press', at: [-6.4, -0.4], yaw: S, via: [[-6.6, 4], [-11, 4], [-11, 1.6]] },
  { id: 'star', title: '1981, the command as a word', at: [-9, -1.3], yaw: N, pitch: -0.2 },
  { id: 'macintosh', title: '1984, the default button', at: [-5.5, -1.3], yaw: N, pitch: -0.2 },
  { id: 'raised', title: '1995, the raised button', at: [-2, -1.3], yaw: N, pitch: -0.2 },
  // III. The material age.
  { id: 'chapter-3', title: 'III. The material age', at: [6.6, -0.4], yaw: S },
  { id: 'aqua', title: '2001, the gel button', at: [2, -1.3], yaw: N, pitch: -0.2 },
  { id: 'slide', title: '2007, slide to unlock', at: [5.5, -1.3], yaw: N, pitch: -0.2 },
  { id: 'leather', title: '2011, the leather button', at: [9, -1.3], yaw: N, pitch: -0.2 },
  // IV. Dissolving.
  { id: 'chapter-4', title: 'IV. Dissolving', at: [7.8, 11.6], yaw: W, via: [[11, 1.2], [11, 3.9], [6.6, 3.9]] },
  { id: 'word', title: '2013, the button as a word', at: [6.6, 5.8], yaw: E, pitch: -0.1 },
  { id: 'material', title: '2014, the paper button', at: [6.6, 9.3], yaw: E, pitch: -0.1 },
  { id: 'quiet', title: 'Today, the quiet button', at: [6.6, 13], yaw: E, pitch: -0.1 },
  // The epilogue, by the way out.
  { id: 'epilogue', title: 'What remains', at: [8.4, 21.5], yaw: N, via: [[6.8, 16.5], [4.2, 16.5], [4.2, 20.5]] },
  { id: 'permanent-return', title: 'Back to the lobby', at: [8.5, 24.3], yaw: S },
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
