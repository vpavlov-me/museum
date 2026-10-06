import type { Chapter } from '../../components/ChapterMark'
import type { WallTextLayout } from '../../components/WallText'
import { STATES_CELLS } from '../../museum/roomRegistry'
import type { ExhibitCardData } from '../../museum/types'

/*
 * Room 03 plan, room-local metres. The room is entered from the transition at
 * z = -7.8 and walked towards -z, one state per cell:
 *
 *   prologue   z  -7.9 … -15    title and thesis
 *   I   LOADING  z -15.2 … -27    unresolved; a placeholder holds the way on
 *   II  EMPTY    z -27.2 … -49    vast and almost bare
 *   III ERROR    z -49.2 … -63    structurally wrong; a wall slab plugs the exit
 *   IV  OFFLINE  z -63.2 … -77    the lights go; reconnect to continue
 *   V   SUCCESS  z -77.2 … -93    tall and bright; a low doorway on to the colophon and the exit
 */
export const CELLS = STATES_CELLS

export { INK } from '../../identity'

export const TITLE = {
  kicker: 'ROOM 03',
  title: 'INTERFACE STATES',
  subtitle: 'WHERE INTERFACES SPEND MOST OF THEIR TIME',
}

export const THESIS = {
  kicker: 'ROOM 03 / THESIS',
  title: 'Somewhere in between.',
  body: 'Most interfaces are designed for the ideal state: the data has arrived, the list is full, the request went through. Most of their life happens somewhere in between. In this room the state is not drawn on a screen. It is the condition of the room you are standing in.',
}

export const THESIS_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 2.4, gap: 0.35, bodyWidth: 3.3 }

export const CHAPTERS = {
  loading: {
    numeral: 'I',
    name: 'LOADING',
    line: 'When the wait could not be removed, it was designed: shapes that promise content, motion that promises progress, numbers that slow down near the end.',
  },
  empty: {
    numeral: 'II',
    name: 'NOTHING HERE YET',
    line: 'Every product begins empty. It is the one screen everybody sees, and nobody is meant to stay on.',
  },
  error: {
    numeral: 'III',
    name: 'SOMETHING\nWENT WRONG',
    line: 'The system is still here; its logic is not. A message that explains nothing asks you to trust the thing that has just failed, and to try again.',
  },
  offline: {
    numeral: 'IV',
    name: "YOU'RE\nOFFLINE",
    line: 'The moment an interface admits it was never the product, only a window onto a system somewhere else. The window is still here.',
  },
  online: {
    numeral: 'IV',
    name: 'BACK\nONLINE',
    line: 'The moment an interface admits it was never the product, only a window onto a system somewhere else. The window is still here.',
  },
  success: {
    numeral: 'V',
    name: 'DONE.',
    line: 'The state every interface is designed for, and the one it spends the least time in.',
  },
} satisfies Record<string, Chapter>

export const CTA_LABEL = 'Create your first exhibit'

export const ERROR_STATUS = {
  broken: 'An unexpected error has occurred.',
  retrying: 'Retrying…',
  still: 'Something went wrong. Please try again.',
  resolved: 'Resolved. No explanation was given.',
}

/** What each state is, for the focus system and screen readers. The walls carry the same words. */
export const CARDS = {
  loading: {
    index: 'I',
    year: 'STATE',
    category: 'LOADING',
    title: 'Loading',
    description: 'The room has not finished loading. Placeholders stand in for its walls, its light and its text, and a progress bar slows down near the end.',
  },
  empty: {
    index: 'II',
    year: 'STATE',
    category: 'EMPTY',
    title: 'Nothing Here Yet',
    description: 'A large, bare room with a single small button: create your first exhibit.',
  },
  error: {
    index: 'III',
    year: 'STATE',
    category: 'ERROR',
    title: 'Something Went Wrong',
    description: 'The room is built wrongly: a wall slab plugs the exit and the rhythm of the walls is broken. Retrying may help.',
  },
  offline: {
    index: 'IV',
    year: 'STATE',
    category: 'OFFLINE',
    title: "You're Offline",
    description: 'The connection has dropped and the lights with it. A broken line runs along the wall to a connection node.',
  },
  success: {
    index: 'V',
    year: 'STATE',
    category: 'SUCCESS',
    title: 'Done.',
    description: 'A tall, bright and almost empty room: the end of Room 03. A low doorway leads on to the exit.',
  },
} satisfies Record<string, ExhibitCardData>
