/*
 * The museum's identity, in one place: its name and credits, the ink colours used
 * on every wall, label and overlay, the typeface, and the type scale of the signage.
 * styles.css mirrors these values as CSS custom properties for the 2D shell.
 * Architectural colour lives in the palettes (scene/materials.ts), not here.
 */

export const MUSEUM = {
  name: 'Interface Museum',
  premise: 'A small museum about the interfaces we use every day without noticing them.',
  /** The permanent exhibition's rooms. The museum's exhibitions are in museum/exhibitions.ts. */
  rooms: [
    ['01', 'The Button'],
    ['02', 'Things We Somehow Accepted'],
    ['03', 'Interface States'],
  ] as const,
  author: 'Vladimir Pavlov',
  year: '2026',
  source: 'https://github.com/vpavlov-me/museum',
}

/** Ink: the warm off-white of the museum's typography, and its quieter tones. */
export const INK = {
  /** Titles and anything that must be read first. */
  text: '#efede6',
  /** Running text. */
  body: '#bdbab2',
  /** Kickers, metadata, signage. */
  muted: '#8f8c85',
  /** Ink for light surfaces (SUCCESS, interface surfaces). */
  dark: '#22211f',
  darkMuted: '#5f5c56',
  /** The museum's own background: what lies beyond the walls. */
  void: '#0a0a0a',
}

/** The same roles, for walls of light stone (the lobby): dark ink in place of off-white. */
export const INK_ON_LIGHT = { text: INK.dark, body: INK.darkMuted, muted: INK.darkMuted }

export type Ink = { text: string; body: string; muted: string }

/** One typeface for walls, labels and the 2D shell (Inter, OFL, subset and self-hosted in /public/fonts). */
export const FONT = {
  regular: '/fonts/inter-regular.woff',
  medium: '/fonts/inter-medium.woff',
}

/**
 * Signage type scale, in metres of cap-to-descender on a wall. Kickers are set
 * in capitals with open tracking; titles are tight; body text is generous.
 */
export const TYPE = {
  roomTitle: 0.42,
  chapter: 0.5,
  wallTitle: 0.4,
  wallBody: 0.155,
  sign: 0.075,
  kicker: 0.1,
  label: 0.085,
  labelMeta: 0.042,
  /** Letter spacing for capitalised kickers and signs. */
  tracking: 0.14,
}
