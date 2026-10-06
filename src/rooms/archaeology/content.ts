import type { WallTextLayout } from '../../components/WallText'
import { ARCHAEOLOGY_CELLS } from '../../museum/roomRegistry'
import type { ExhibitCardData } from '../../museum/types'

/*
 * Room 04 plan, room-local metres. The room is entered from the passage at
 * z = -7.8 and walked towards -z:
 *
 *   I   ACCESSION       z  -7.9 … -15    the archive's lobby: title, thesis, its own sign
 *   II  THE TRENCH      z -15.2 … -33    a hall around a stepped excavation; finds under soil
 *   III THE STORE       z -33.2 … -47    low shelving and three vitrines
 *   IV  RECONSTRUCTION  z -47.2 … -57    a dark room with the archive's diorama; then the colophon
 *
 * Two voices. The museum speaks on the walls, in its own ink. The archive speaks on
 * its catalogue cards, dark on pale: confident, often wrong, not always.
 */
export const CELLS = ARCHAEOLOGY_CELLS

export { INK } from '../../identity'

/** The archive's own ink and card stock. */
export const ARCHIVE = {
  card: '#d8d1c2',
  ink: '#2a2723',
  inkMuted: '#6b655b',
}

export const TITLE = {
  kicker: 'ROOM 04',
  title: 'INTERFACE ARCHAEOLOGY',
  subtitle: 'OUR INTERFACES, AS A FUTURE ARCHIVE CATALOGUES THEM',
}

export const THESIS = {
  kicker: 'ROOM 04 / THESIS',
  title: 'Read by someone else.',
  body: 'An interface only makes sense to the people using it. Imagine ours found by a future that never used them: the gestures gone, only the signs left. The labels in this room are written by that future. They are confident. They are often wrong. Not always.',
}

export const THESIS_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 2.4, gap: 0.35, bodyWidth: 3.3 }

/** The future institution's own sign, in its own voice. */
export const INSTITUTE = {
  name: 'INSTITUTE FOR EARLY SCREENS',
  gallery: 'Gallery of the Glass Period',
  dates: 'c. 1973 – 2030',
  line: 'Finds from the period in which people lived in front of lit rectangles. Arranged by layer. Interpretations are provisional.',
}

export const AFTERWORD = {
  kicker: 'ROOM 04 / AFTERWORD',
  title: 'Not entirely wrong.',
  body: 'A future that never used our interfaces would misread nearly every object. It would still see what they asked of us: our attention, our agreement, our hours.',
}

export const AFTERWORD_LAYOUT: WallTextLayout = { top: 2.4, titleWidth: 2.2, gap: 0.35, bodyWidth: 2.6 }

/** The trench's layers, oldest at the bottom. Each step of the excavation stops at the foot of one. */
export const LAYERS = [
  { numeral: 'I', dates: 'c. 2007 –', color: '#6b5b48' },
  { numeral: 'II', dates: 'c. 1990 – 2007', color: '#544639' },
  { numeral: 'III', dates: 'c. 1973 – 1990', color: '#3d332a' },
] as const

/**
 * A find, as catalogued. `reading` is the archive's (and is what its card says);
 * `was` is what the thing was. Screen readers and the text version get both.
 */
export type Find = {
  id: string
  accession: string
  layer: string
  name: string
  reading: string
  was: string
}

export const FINDS = {
  seal: {
    id: 'seal',
    accession: 'GP-0342',
    layer: 'LAYER I',
    name: 'Seal of the hidden chamber',
    reading: 'Three bars, set in the upper corner of nearly every surface of the period. Behind them the people kept everything they did not want to look at.',
    was: 'The menu icon, called the hamburger. Drawn for the Xerox Star in 1981, it became the usual way to fold navigation away on small screens around 2010.',
  },
  tablet: {
    id: 'tablet',
    accession: 'GP-0114',
    layer: 'LAYER II',
    name: 'Votive tablet',
    reading: 'A square tablet with a sliding shutter, pressed to preserve things. The tablet itself vanishes from the ground in this layer. Carved images of it go on appearing above, for as long as the period lasts.',
    was: 'The 3.5-inch floppy disk, and the save icon drawn from it. The disk left everyday use in the 2000s; its picture is still how most software says save.',
  },
  arrowheads: {
    id: 'arrowheads',
    accession: 'GP-0001',
    layer: 'LAYERS I – III',
    name: 'Arrowheads',
    reading: 'Found in every layer, in vast numbers, always pointing up and to the left. Too small to hunt with. Probably ceremonial.',
    was: 'The mouse pointer. Its lean is usually traced to the coarse screens of the 1970s and 80s, where an arrow drawn at an angle stayed legible in very few pixels. The screens changed; the lean stayed.',
  },
  inscriptions: {
    id: 'inscriptions',
    accession: 'GP-0790',
    layer: 'STORE / CASE 1',
    name: 'Sealed inscriptions',
    reading: 'Lines of identical marks. The writing was sealed at the moment it was written, so that not even its author could read it back. Decipherment continues.',
    was: 'The password field, which hides every character as it is typed.',
  },
  hoard: {
    id: 'hoard',
    accession: 'GP-1206',
    layer: 'STORE / CASE 2',
    name: 'Token hoard',
    reading: 'Heart-shaped tokens, found in hoards of millions. They were given freely and constantly. No record has been found of anything bought with them.',
    was: 'The like: a count of approval attached to almost everything published in the period.',
  },
  oath: {
    id: 'oath',
    accession: 'GP-1555',
    layer: 'STORE / CASE 3',
    name: 'The oath',
    reading: 'A short vow, sworn by everyone, many times a day, with one mark in a small square. The full text it refers to survives in thousands of copies. None shows signs of having been read.',
    was: 'The terms-of-service checkbox: “I have read and agree.”',
  },
  shrine: {
    id: 'shrine',
    accession: 'GP-2030',
    layer: 'RECONSTRUCTION',
    name: 'Shrine of a dwelling',
    reading: 'A seat faces a large lit rectangle; a smaller one rests within reach. The devout faced them for most of their waking hours. The rectangles have not survived. Their light is assumed.',
    was: 'A living room with a television and a phone. The archive gets every object wrong, and the hours right.',
  },
} satisfies Record<string, Find>

/** DECIPHER: how many times the archive has tried before the visitor arrives. */
export const ATTEMPTS_BEFORE = 4102

/** A find as an exhibit card: the archive's reading first, then what it was. */
export const cardOf = (find: Find): ExhibitCardData => ({
  index: find.accession,
  year: find.layer,
  category: 'FIND',
  title: find.name,
  description: `The archive's reading: ${find.reading} What it was: ${find.was}`,
})

export const CARDS = {
  institute: {
    index: 'I',
    year: 'GLASS PERIOD',
    category: 'ACCESSION',
    title: 'Institute for Early Screens',
    description: `The archive's sign. ${INSTITUTE.gallery}, ${INSTITUTE.dates}. ${INSTITUTE.line}`,
  },
} satisfies Record<string, ExhibitCardData>
