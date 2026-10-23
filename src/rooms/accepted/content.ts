import type { EssayChapter } from '../../components/ChapterWall'
import { FREE_WALL_FACE as FACE, type FreeWall } from '../../components/FreeWall'
import type { ExhibitCardData } from '../../museum/types'

/*
 * Room 02, Things We Somehow Accepted (v4, #55): one hall north of The Button's,
 * room-local metres x -12…12, z -14…14, entered from The Button through the portal at
 * z = 14. Laid out like The Button's: a prologue to the left of the entrance, three
 * bays clockwise round a centre that holds the key visual, an epilogue by the way out.
 *
 *   I    INTERRUPT      west    the cookie banner overhead, the modals on a plinth
 *   II   PROVE, ATTEND  north   a badge on a plinth and a wall of them; the CAPTCHA
 *   III  WAIT, CONTINUE east    two skeleton screens standing like partitions
 *   ·    centre                 the feed: a column of posts rising into the ceiling
 */

export const FREE_WALLS: FreeWall[] = [
  { axis: 'x', at: 7, from: -12, to: -5 }, // prologue | I
  { axis: 'z', at: -5, from: -3, to: 4 }, // I
  { axis: 'x', at: -6, from: -7, to: 7 }, // II
  { axis: 'z', at: 5, from: -3, to: 4 }, // III
  { axis: 'x', at: 7, from: 5, to: 12 }, // III | epilogue
]

export const CARDS = {
  banner: {
    index: '01',
    year: '2011',
    category: 'CONSENT',
    title: 'The Cookie Banner',
    description:
      'A privacy law asked for informed consent. Interfaces answered with a wall across the page. The way through is always the brightest button; the other way is narrow and easy to miss.',
  },
  modal: {
    index: '02',
    year: '1984',
    category: 'INTERRUPTION',
    title: 'The Modal',
    description:
      'A dialog that stops everything until it is answered. Designed for decisions that truly could not wait, now used for offers, permissions and goodbyes. Close one and the next is waiting behind it.',
  },
  badge: {
    index: '03',
    year: '2007',
    category: 'ATTENTION',
    title: 'The Notification Badge',
    description:
      'A small red circle meaning something happened while you were away. Over time it stopped reporting change and started producing it. Behind the one on the plinth, every icon wants a number.',
  },
  captcha: {
    index: '04',
    year: '2000',
    category: 'VERIFICATION',
    title: 'The CAPTCHA',
    description:
      'A test to tell people from machines. The cost is paid entirely by the people, a few seconds at a time, and the answers have often been used to train the machines.',
  },
  skeleton: {
    index: '05',
    year: '2013',
    category: 'PERCEIVED PERFORMANCE',
    title: 'The Skeleton Screen',
    description:
      'Grey shapes standing in for content that has not arrived. Introduced to make waiting feel shorter, they now promise a layout before there is anything to put in it.',
  },
  feed: {
    index: '06',
    year: '2006',
    category: 'ENGAGEMENT · KINETIC INSTALLATION',
    title: 'Infinite Scroll',
    description:
      'Removing the bottom of the page also removed a natural place to stop. Here the feed rises from the floor and disappears into the ceiling, twelve metres of posts that never run out. It has no last item, only the moment you decide to leave.',
  },
} satisfies Record<string, ExhibitCardData>

export type ModalLayer = { title: string; body: string; primary: string; secondary: string }

/** The modals, front to back: closing one shows the next. */
export const MODALS: ModalLayer[] = [
  { title: 'Before you go', body: 'Join 40,000 visitors who get our newsletter every morning.', primary: 'Subscribe', secondary: 'No thanks, I prefer to stay uninformed' },
  { title: 'Turn on notifications?', body: 'Be the first to know when something happens in this room.', primary: 'Allow', secondary: 'Not now' },
  { title: 'Are you sure you want to leave?', body: 'You have unsaved progress.', primary: 'Stay', secondary: 'Leave anyway' },
]

/** Where everything stands, room-local: [x, z] on the floor (for a wall exhibit, on the wall). */
export const LAYOUT = {
  /** The banner hangs across bay I, wall to wall, its lower edge above head height. */
  banner: { from: -12, to: -5, z: 1.5, bottom: 2.4, height: 1.3 },
  bannerLabel: [-12, 4.6] as [number, number],
  modals: [-8.8, -2.5] as [number, number],
  badge: [-6.5, -11] as [number, number],
  /** The wall of badges, on the hall's north wall. */
  badgeWall: { from: -11, to: -2.6, z: -14 },
  captcha: [4.6, -14] as [number, number],
  skeletons: [
    [9.3, -3],
    [9.3, 2.5],
  ] as [number, number][],
  skeletonLabel: [12, -0.45] as [number, number],
  /** The feed's column, and the lectern with its label, facing the entrance. */
  feed: [0, 0.5] as [number, number],
  lectern: [0, 5.6] as [number, number],
  returnDoor: 8.5,
}

/*
 * The essay, "The way things are", in five parts, each on the wall facing its bay.
 */
export const ESSAY: (EssayChapter & { zone: 'P' | 'I' | 'II' | 'III' | 'E' })[] = [
  {
    id: 'accepted-prologue',
    zone: 'P',
    kicker: 'PROLOGUE',
    title: 'The way things are.',
    paragraphs: [
      'Many interface conventions did not begin as good ideas. They began as compromises: a legal requirement, a slow network, a growth target, a bot problem. Repeated often enough, each one stopped looking like a decision and started looking like the way things are.',
      'This hall collects six of them. None is a mistake in the usual sense. Each solved a problem for somebody, and each moved a small cost onto everybody else: a second of attention, a click, a choice made in a hurry.',
      'They are shown here as things, so that they can be walked around. On a screen they are too familiar to be seen.',
    ],
    quote: 'Repeated often enough, a compromise starts to look like the way things are.',
    position: [-11.6, 7 + FACE],
    facing: 'south',
  },
  {
    id: 'accepted-chapter-1',
    zone: 'I',
    kicker: 'I / INTERRUPT',
    title: 'Something in the way.',
    paragraphs: [
      'The oldest thing here is the modal: a dialog that stops everything until it is answered. It was meant for decisions that could not wait, unsaved work or a disk about to be erased. Now it asks for newsletters, notifications and reviews.',
      'The cookie banner arrived with a law that asked for informed consent. Interfaces answered with a wall across the page. The way through is always the brightest button; the other way is narrow, grey and easy to miss.',
      'Both teach the same lesson. When something stands between you and what you came for, you learn to clear it without reading it. The interruption wins the click and loses the meaning.',
    ],
    quote: 'The way through is always the brightest button.',
    position: [-5 - FACE, -2.6],
    facing: 'west',
  },
  {
    id: 'accepted-chapter-2',
    zone: 'II',
    kicker: 'II / PROVE, ATTEND',
    title: 'Every surface wants a number.',
    paragraphs: [
      'The badge began as a courtesy: something changed while you were away. Then products learned that an unresolved count is the most reliable way to bring someone back, and every icon started asking for attention at once.',
      'The CAPTCHA asks the opposite question. It does not want your attention; it wants proof that you are a person. The cost is paid by the people, a few seconds at a time, and their answers have often been used to train the machines they were meant to keep out.',
      'One demands that you look, the other that you prove you can. In both, the interface has stopped serving you and started asking you to serve it.',
    ],
    quote: 'The badge stopped reporting change and started producing it.',
    position: [6.6, -6 - FACE],
    facing: 'north',
  },
  {
    id: 'accepted-chapter-3',
    zone: 'III',
    kicker: 'III / WAIT, CONTINUE',
    title: 'Waiting, redesigned.',
    paragraphs: [
      'When interfaces could not be faster, they learned to look busier. The skeleton screen does not shorten the wait. It makes the wait look like progress, and the shape of content arrives long before the content does.',
      'The infinite feed removed the other end. A page used to have a bottom, and the bottom was a natural place to stop. The feed has no last item, only the moment you decide to leave, and it is designed to make that moment come as late as possible.',
      'Between them they take care of time: the time before something arrives, and the time after you have had enough.',
    ],
    quote: 'The feed has no last item, only the moment you decide to leave.',
    position: [5 + FACE, 3.6],
    facing: 'east',
  },
  {
    id: 'accepted-epilogue',
    zone: 'E',
    kicker: 'EPILOGUE',
    title: 'Accepted, not chosen.',
    paragraphs: [
      'None of these was voted for. Each appeared somewhere, worked for someone, and spread because everyone else was doing it. That is how a convention is made, and also how it hides.',
      'Seeing them as objects is a small way of getting the choice back. A banner can be smaller. A dialog can wait. A count can stay at zero. A feed can end.',
      'The buttons in the hall behind you made a promise. The things in this one show how easily it can be bent, one reasonable compromise at a time.',
    ],
    quote: 'A feed can end.',
    position: [5.4, 7 + FACE],
    facing: 'south',
  },
]

/** The exhibits of each zone, in the order the text version lists them after its chapter. */
export const ZONE_CARDS: Record<'P' | 'I' | 'II' | 'III' | 'E', ExhibitCardData[]> = {
  P: [],
  I: [CARDS.banner, CARDS.modal],
  II: [CARDS.badge, CARDS.captcha],
  III: [CARDS.skeleton, CARDS.feed],
  E: [],
}
