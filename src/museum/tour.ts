/*
 * The guided tour: an authored walk through the same museum, for touch screens and
 * for anyone who prefers not to steer. Each stop is a place to stand and a direction
 * to face, in route order; `via` are the points walked through on the way there
 * (door centres, the way round a plinth), in world metres. Yaw 0 faces north (-z),
 * positive turns left.
 *
 * The tour walks the same floor as the visitor and is stopped by the same things:
 * a closed CAPTCHA gate or an unloaded doorway holds it until the room allows it.
 */

export type TourStop = {
  id: string
  title: string
  at: [number, number]
  yaw: number
  via?: [number, number][]
}

const N = 0
const W = Math.PI / 2
const E = -Math.PI / 2

export const TOUR: TourStop[] = [
  // Entrance
  { id: 'entrance', title: 'Interface Museum', at: [0, 24.6], yaw: N },
  { id: 'statement', title: 'Interfaces, given physical form', at: [0.6, 20.6], yaw: W },
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
  // Colophon
  { id: 'colophon', title: 'Thank you for visiting', at: [-16.2, -183.6], yaw: 0.15, via: [[-15.4, -178.4]] },
  { id: 'exit', title: 'Exit', at: [-13.6, -185.9], yaw: N },
]
