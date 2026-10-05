import type { WallTextLayout } from '../../components/WallText'
import type { ExhibitCardData } from '../../museum/types'

/*
 * Room 02 plan, room-local metres. The visitor enters at z = +15 and walks towards -z
 * through a sequence of interruptions:
 *
 *   z  15 … 8    vestibule (thesis, title)      → cookie banner across the room at z = 8
 *   z   8 … 0    notification badges
 *   z   0 … -7   three layered modals
 *   z  -8        CAPTCHA checkpoint in a partition wall
 *   z  -8 … -15  skeleton screens
 *   z -15 … -35  the feed, ending at a closed passage
 */
export const HALL = { minX: -6, maxX: 6, minZ: -15, maxZ: 15, height: 4.2 }
export const FEED = { minX: -1.5, maxX: 1.5, minZ: -35.2, maxZ: -15.2, height: 3.2 }

export const BANNER_Z = 8
export const CAPTCHA_Z = -8

// Narrower than Room 01's wall texts: this room is denser and the walls are shorter.
export const COMPACT_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 2.6, gap: 0.4, bodyWidth: 3.5 }

export const THESIS = {
  kicker: 'ROOM 02 / THESIS',
  title: 'Things we somehow accepted.',
  body: 'Many interface conventions did not begin as good ideas. They began as compromises: a legal requirement, a slow network, a growth target, a bot problem. Repeated often enough, each one stopped looking like a decision and started looking like the way things are.',
}

export const OBSERVATIONS = {
  badges: {
    kicker: 'OBSERVATION / 02',
    title: 'Every surface wants a number.',
    body: 'The badge began as a courtesy: something changed while you were away. Then products learned that an unresolved count is the most reliable way to bring someone back, and every icon started asking for attention at once.',
  },
  waiting: {
    kicker: 'OBSERVATION / 03',
    title: 'Waiting, redesigned.',
    body: 'When interfaces could not be faster, they learned to look busier. The skeleton screen does not shorten the wait. It makes the wait look like progress, and the shape of content arrives long before the content does.',
  },
}

export const CARDS = {
  banner: {
    index: '01',
    year: '2011',
    category: 'CONSENT',
    title: 'The Cookie Banner',
    description: 'A privacy law asked for informed consent. Interfaces answered with a wall across the page. The way through is always the brightest button; the other way is narrow and easy to miss.',
  },
  badge: {
    index: '02',
    year: '2007',
    category: 'ATTENTION',
    title: 'The Notification Badge',
    description: 'A small red circle meaning something happened while you were away. Over time it stopped reporting change and started producing it.',
  },
  modal: {
    index: '03',
    year: '1984',
    category: 'INTERRUPTION',
    title: 'The Modal',
    description: 'A dialog that stops everything until it is answered. Designed for decisions that truly could not wait, now used for offers, permissions and goodbyes.',
  },
  captcha: {
    index: '04',
    year: '2000',
    category: 'VERIFICATION',
    title: 'The CAPTCHA',
    description: 'A test to tell people from machines. The cost is paid entirely by the people, a few seconds at a time, and the answers have often been used to train the machines.',
  },
  skeleton: {
    index: '05',
    year: '2013',
    category: 'PERCEIVED PERFORMANCE',
    title: 'The Skeleton Screen',
    description: 'Grey shapes standing in for content that has not arrived. Introduced to make waiting feel shorter, they now promise a layout before there is anything to put in it.',
  },
  feed: {
    index: '06',
    year: '2006',
    category: 'ENGAGEMENT',
    title: 'Infinite Scroll',
    description: 'Removing the bottom of the page also removed a natural place to stop. The feed has no last item, only the moment you decide to leave.',
  },
  next: {
    index: 'NEXT',
    year: 'IN PREPARATION',
    category: 'ROOM 03',
    title: 'Interface States',
    description: 'Loading, empty, error, success, offline and locked, presented as spaces rather than screens. This passage opens in a later prototype.',
  },
} satisfies Record<string, ExhibitCardData>

export type ModalLayer = {
  z: number
  x: number
  y: number
  width: number
  height: number
  title: string
  body: string
  primary: string
  secondary: string
}

export const MODALS: ModalLayer[] = [
  {
    z: -1.5,
    x: -0.35,
    y: 1.8,
    width: 2.6,
    height: 1.5,
    title: 'Before you go',
    body: 'Join 40,000 visitors who get our newsletter every morning.',
    primary: 'Subscribe',
    secondary: 'No thanks, I prefer to stay uninformed',
  },
  {
    z: -3.6,
    x: 0.45,
    y: 1.7,
    width: 2.4,
    height: 1.4,
    title: 'Turn on notifications?',
    body: 'Be the first to know when something happens in this room.',
    primary: 'Allow',
    secondary: 'Not now',
  },
  {
    z: -5.7,
    x: 0,
    y: 1.62,
    width: 2.2,
    height: 1.3,
    title: 'Are you sure you want to leave?',
    body: 'You have unsaved progress.',
    primary: 'Stay',
    secondary: 'Leave anyway',
  },
]
