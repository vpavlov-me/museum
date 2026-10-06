import type { Chapter } from '../../components/ChapterMark'
import type { WallTextLayout } from '../../components/WallText'
import { ACCEPTED_CELLS } from '../../museum/roomRegistry'
import type { ExhibitCardData } from '../../museum/types'

/*
 * Room 02 plan, room-local metres. The visitor enters at z = 0 through the
 * south-west corner and walks towards -z through three chapters, separated by
 * pauses and offset openings:
 *
 *   INTERRUPT     z    0 … -17   thesis, cookie banner at z = -6.6, three modals
 *   (pause)       z  -17 … -21   low and quiet, the chapter II title
 *   PROVE/ATTEND  z  -21 … -35   one badge on a plinth, then many; CAPTCHA gate at z = -35.15
 *   WAIT/CONTINUE z  -35 … -46   skeleton panels as partitions
 *                 z  -46 … -66   the feed, ending at the door to Room 03
 */
export const CELLS = ACCEPTED_CELLS
export const FEED = ACCEPTED_CELLS.feed

export const BANNER_Z = -6.6
export const CAPTCHA_Z = -35.15

export const CHAPTERS = {
  interrupt: { numeral: 'I', name: 'INTERRUPT', line: 'Interfaces that block what you came to do.' },
  attend: { numeral: 'II', name: 'PROVE /\nATTEND', line: 'Interfaces that demand proof, or attention.' },
  wait: { numeral: 'III', name: 'WAIT /\nCONTINUE', line: 'Interfaces that stretch time and keep you inside.' },
} satisfies Record<string, Chapter>

// Narrower than Room 01's wall texts: this room is denser and the walls are shorter.
export const COMPACT_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 2.4, gap: 0.35, bodyWidth: 3.3 }

export const THESIS = {
  kicker: 'ROOM 02 / THESIS',
  title: 'The way things are.',
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
    z: -9.4,
    x: 1.9,
    y: 1.8,
    width: 2.6,
    height: 1.5,
    title: 'Before you go',
    body: 'Join 40,000 visitors who get our newsletter every morning.',
    primary: 'Subscribe',
    secondary: 'No thanks, I prefer to stay uninformed',
  },
  {
    z: -12,
    x: 5.8,
    y: 1.7,
    width: 2.4,
    height: 1.4,
    title: 'Turn on notifications?',
    body: 'Be the first to know when something happens in this room.',
    primary: 'Allow',
    secondary: 'Not now',
  },
  {
    z: -14.6,
    x: 2.8,
    y: 1.62,
    width: 2.2,
    height: 1.3,
    title: 'Are you sure you want to leave?',
    body: 'You have unsaved progress.',
    primary: 'Stay',
    secondary: 'Leave anyway',
  },
]
