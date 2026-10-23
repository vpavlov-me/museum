import { ACCEPTED_HALL } from '../../../museum/roomRegistry'
import { basicMaterial } from '../../../scene/materials'

/** The hall's ceiling height: cables and the feed reach it. */
export const CEILING = ACCEPTED_HALL.height

/*
 * The interface's own colours, for exhibits that are pieces of screens: they ignore the
 * room's light (unlit), as the screen-era buttons in The Button do.
 */
export const SCREEN = {
  paper: basicMaterial('#f7f7f5'),
  line: basicMaterial('#dcdbd7'),
  ink: '#1d1d1b',
  muted: '#6b6a66',
  blue: '#2f63f0',
  blueFill: basicMaterial('#2f63f0'),
  red: '#e5483b',
  redFill: basicMaterial('#e5483b'),
}

/** Seconds since a moment held in a ref; Infinity before it ever happened. */
export const since = (at: number, now: number) => (Number.isFinite(at) ? now - at : Infinity)
