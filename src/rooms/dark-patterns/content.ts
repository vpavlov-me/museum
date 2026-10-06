import type { WallTextLayout } from '../../components/WallText'
import { DARK_CELLS } from '../../museum/roomRegistry'
import type { ExhibitCardData } from '../../museum/types'

/*
 * Dark Patterns, the temporary exhibition: one room walked as a purchase and a
 * cancellation, room-local metres. Entered from the passage off the lobby at z = -7.8:
 *
 *   I   WELCOME     the title, a countdown that never ends, a crowd that is not there
 *   II  CHECKOUT    a free ticket that collects fees as you walk; a box ticked for you
 *   III LEAVING     a big door to stay, a small one to leave, and the cancellation flow
 *                   folded into four corridors, each turn with one more screen
 *   IV  CANCELLED   the afterword, and the door back to the lobby
 *
 * Two voices: the exhibition's own signs use the patterns; small gallery labels, in
 * the museum's voice, name each one and say what it does.
 */
export const CELLS = DARK_CELLS

export { INK } from '../../identity'

/** The signs' voice: the bright, insistent ink of a checkout page, kept to the screens and buttons. */
export const SALES = {
  surface: '#f2f0ea',
  ink: '#1f1e1c',
  urgent: '#c8473b',
  button: '#2f5bd3',
  quiet: '#9a978f',
}

export const TITLE = {
  kicker: 'TEMPORARY EXHIBITION 03',
  title: 'DARK PATTERNS',
  subtitle: 'INTERFACES DESIGNED AGAINST THE PEOPLE USING THEM',
}

export const THESIS = {
  kicker: 'DARK PATTERNS / THESIS',
  title: 'Designed against you.',
  body: 'Some interfaces are built to make people do what they did not mean to do: buy more, agree, stay. These are not accidents of habit. They are designed, tested and kept because they work. In this exhibition the signs use them on you. The small labels say what they are doing.',
}

export const THESIS_LAYOUT: WallTextLayout = { top: 2.6, titleWidth: 2.4, gap: 0.35, bodyWidth: 3.2 }

export const AFTERWORD = {
  kicker: 'DARK PATTERNS / AFTERWORD',
  title: 'It worked, a little.',
  body: 'You took the longer way because the shorter one was hidden, and read every screen because each one asked. That is all a dark pattern needs: not to fool everyone, only enough people, every day. Harry Brignull named them in 2010. He now calls them deceptive design.',
}

export const AFTERWORD_LAYOUT: WallTextLayout = { top: 2.45, titleWidth: 2.2, gap: 0.35, bodyWidth: 2.8 }

/** A pattern, as the museum's labels name it. */
export type Pattern = { id: string; name: string; also?: string; text: string }

export const PATTERNS = {
  urgency: {
    id: 'urgency',
    name: 'False urgency',
    text: 'A deadline that is not real. This countdown starts again every time it runs out. Pressure to decide now is pressure not to think.',
  },
  social: {
    id: 'social',
    name: 'Fake social proof',
    text: 'Other people, invented. The number of visitors “looking at this room” is made up, and moves to look alive.',
  },
  drip: {
    id: 'drip',
    name: 'Drip pricing',
    also: 'hidden costs',
    text: 'The price you see first is not the price you pay. Fees appear one at a time, each too small to turn back for, until the total.',
  },
  basket: {
    id: 'basket',
    name: 'Sneak into basket',
    also: 'pre-selection',
    text: 'Something you did not choose, added for you. Untick it and it comes back: the default is the decision most people never change.',
  },
  shaming: {
    id: 'shaming',
    name: 'Confirmshaming',
    text: 'The way out is worded to make you feel foolish for taking it. The way in is large, lit and polite.',
  },
  motel: {
    id: 'motel',
    name: 'Roach motel',
    also: 'obstruction',
    text: 'Easy to get into, hard to get out of. Subscribing took one click; leaving takes every corridor of this room.',
  },
} satisfies Record<string, Pattern>

/** The receipt along the checkout counter, revealed as the visitor walks west. */
export const RECEIPT = [
  { item: 'Ticket', price: 0, note: 'FREE' },
  { item: 'Service fee', price: 4.99 },
  { item: 'Booking protection', price: 6.0, note: 'PRE-SELECTED' },
  { item: 'Processing', price: 2.5 },
  { item: 'Carbon offset', price: 1.2, note: 'PRE-SELECTED' },
  { item: 'Handling', price: 3.0 },
]

export const TOTAL = RECEIPT.reduce((sum, line) => sum + line.price, 0)

/** The cancellation flow, one screen at the end of each corridor. */
export const FLOW = [
  { title: 'Are you sure you want to leave?', body: 'You will lose access to everything, forever.', yes: 'Keep my plan', no: 'Continue cancelling' },
  { title: 'Before you go: 50% off for 3 months.', body: 'This offer is only for you, and only today.', yes: 'Claim my discount', no: 'No, continue' },
  { title: 'Tell us why you are leaving.', body: 'Too expensive · Not using it · Found something better · Other (please explain in at least 200 characters)', yes: 'Submit', no: 'Skip' },
  { title: 'Please hold. You are number 7 in the queue.', body: 'An agent will help you cancel. Average wait: 14 minutes.', yes: 'Wait', no: 'cancel' },
]

export const CONFIRMSHAMING = {
  stay: 'YES, KEEP ME SUBSCRIBED',
  leave: 'No thanks, I don’t like saving money',
  thanks: 'Thank you for staying!',
  thanksLine: 'We knew you would. The way on is back through the door you came in by.',
}

export const cardOf = (pattern: Pattern): ExhibitCardData => ({
  index: 'PATTERN',
  year: 'DARK PATTERNS',
  category: pattern.also ? `${pattern.name} / ${pattern.also}`.toUpperCase() : pattern.name.toUpperCase(),
  title: pattern.name,
  description: pattern.text,
})

export const CARDS = {
  exit: {
    index: 'END',
    year: 'EXHIBITION 03',
    category: 'DARK PATTERNS',
    title: 'The end of Dark Patterns',
    description: 'The door ahead leads back to the lobby. No survey, no last offer.',
  },
} satisfies Record<string, ExhibitCardData>
