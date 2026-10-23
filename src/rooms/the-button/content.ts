import type { Facing } from '../../components/WallText'
import type { ExhibitCardData } from '../../museum/types'

/** Which object stands on the display: each is drawn by its own component (artifacts/index.ts). */
export type ArtifactKind =
  | 'typewriter'
  | 'switch'
  | 'call'
  | 'doorbell'
  | 'star'
  | 'macintosh'
  | 'raised'
  | 'aqua'
  | 'slide'
  | 'leather'
  | 'word'
  | 'material'
  | 'quiet'

/** How an exhibit is shown: on a low oak plinth, on a wide one, in a vitrine, or framed on a wall. */
export type Display = 'plinth' | 'wide' | 'vitrine' | 'wall'

export type Bay = 'I' | 'II' | 'III' | 'IV'

export type ButtonExhibit = ExhibitCardData & {
  id: string
  bay: Bay
  /** Display centre on the floor plane (for a wall, the point on the wall): [x, z], room-local. */
  position: [number, number]
  /** The way the display's front (and its label) faces. */
  facing: Facing
  display: Display
  artifact: { kind: ArtifactKind; label: string; prompt: string }
}

export type RoomWallText = {
  id: string
  facing: Facing
  /** [x, z] where the block begins. */
  position: [number, number]
  kicker: string
  title: string
  body: string
}

/*
 * The hall (#48), room-local metres: x -12…12, z -16…16, the lobby's portal at z = 16.
 * Free-standing walls 4 m high divide it into a prologue by the entrance, four bays
 * round the centre (I to the west, II and III to the north, IV to the east) and an
 * epilogue by the door back to the lobby. The centre is kept for the key visual.
 * Thirteen objects, clockwise in the order of the essay: I, before the screen (objects
 * on low plinths and one on the wall); II and III, the drawn and the material button
 * (vitrines along the north wall); IV, the button dissolving (wide plinths).
 */

/** A free-standing wall: along x at z = `at` (axis 'x'), or along z at x = `at` (axis 'z'). */
export type FreeWall = { axis: 'x' | 'z'; at: number; from: number; to: number }

export const FREE_WALL = { height: 4, thickness: 0.3 }

export const FREE_WALLS: FreeWall[] = [
  { axis: 'x', at: 8, from: -12, to: -5 }, // prologue | I
  { axis: 'z', at: -5, from: -3, to: 5 }, // I
  { axis: 'x', at: -7, from: -10, to: -3 }, // II
  { axis: 'x', at: -7, from: 3, to: 10 }, // III
  { axis: 'z', at: 5, from: -3, to: 5 }, // IV
  { axis: 'x', at: 8, from: 5, to: 12 }, // IV | epilogue
]

const FACE = FREE_WALL.thickness / 2 + 0.02

export const EXHIBITS: ButtonExhibit[] = [
  // I. Before the screen: the physical buttons the metaphor grew out of. West bay, facing east.
  {
    id: 'typewriter',
    bay: 'I',
    index: '01',
    year: '1878',
    category: 'REMINGTON',
    title: 'The Typewriter Key',
    description:
      'Round keys on long levers: press one and a typebar swings up to strike the paper. The Remington No. 2 added a shift key and kept the QWERTY order keyboards still use. Every key gave the same short travel and the same answer, a sound and a mark.',
    position: [-8.8, 5],
    facing: 'east',
    display: 'plinth',
    artifact: { kind: 'typewriter', label: 'QWERTY', prompt: 'PRESS' },
  },
  {
    id: 'switch',
    bay: 'I',
    index: '02',
    year: '1884',
    category: 'J. H. HOLMES',
    title: 'The Light Switch',
    description:
      'John Henry Holmes made the switch snap its contacts apart on a spring, so every turn of the knob ended in a click. The light changed at once, and the hand learned that a control has two positions and a sound between them.',
    position: [-12, 2],
    facing: 'east',
    display: 'wall',
    artifact: { kind: 'switch', label: '', prompt: 'PRESS' },
  },
  {
    id: 'call',
    bay: 'I',
    index: '03',
    year: '1900s',
    category: 'ELEVATOR',
    title: 'The Call Button',
    description:
      'Electric elevators put a brass plate on every landing: press once, and a lamp says the request has been heard. The car is on its way whether you press again or not, and people press again anyway.',
    position: [-8.8, -1],
    facing: 'east',
    display: 'plinth',
    artifact: { kind: 'call', label: '', prompt: 'PRESS' },
  },
  {
    id: 'doorbell',
    bay: 'I',
    index: '04',
    year: '1910s',
    category: 'ELECTRIC BELL',
    title: 'The Bell Push',
    description:
      'An ivory push in a brass rosette: the smallest button in the house, and the first one most people owned. Nothing happens where you stand. The answer comes from another room, and you wait to hear it.',
    position: [-8.8, -4.6],
    facing: 'east',
    display: 'plinth',
    artifact: { kind: 'doorbell', label: '', prompt: 'PRESS' },
  },

  // II. Drawing a press: the button as a picture on the screen. North wall, west half, facing south.
  {
    id: 'star',
    bay: 'II',
    index: '05',
    year: '1981',
    category: 'XEROX 8010 STAR',
    title: 'The Command as a Word',
    description:
      'The Star drew its commands as plain rectangles with a word inside. Nothing about them looked pressable: the frame only said that here was something to point at with the mouse. Selected, a command turned black.',
    position: [-9, -13.5],
    facing: 'south',
    display: 'vitrine',
    artifact: { kind: 'star', label: 'Done', prompt: 'CLICK' },
  },
  {
    id: 'macintosh',
    bay: 'II',
    index: '06',
    year: '1984',
    category: 'APPLE MACINTOSH, SYSTEM 1',
    title: 'The Default Button',
    description:
      'A rounded rectangle with a heavier border: the one answer the system expects, and Return chooses it. For the first time a button tells you which way the conversation should go. Repeated a billion times, the suggestion became a habit.',
    position: [-5.5, -13.5],
    facing: 'south',
    display: 'vitrine',
    artifact: { kind: 'macintosh', label: 'OK', prompt: 'CLICK' },
  },
  {
    id: 'raised',
    bay: 'II',
    index: '07',
    year: '1995',
    category: 'MICROSOFT WINDOWS 95',
    title: 'The Raised Button',
    description:
      'Light from the top left, shadow at the bottom right: two lines of pixels turned a grey rectangle into a slab standing off the screen. Pressed, the lines swap and the slab sinks. A generation learned to press by reading that shadow.',
    position: [-2, -13.5],
    facing: 'south',
    display: 'vitrine',
    artifact: { kind: 'raised', label: 'OK', prompt: 'PRESS' },
  },

  // III. The material age: the button as a thing to touch. North wall, east half, facing south.
  {
    id: 'aqua',
    bay: 'III',
    index: '08',
    year: '2001',
    category: 'APPLE MAC OS X, AQUA',
    title: 'The Gel Button',
    description:
      'Aqua made buttons out of blue, translucent gel with a highlight like light on a drop of water, and the default one pulsed slowly, as if breathing. The aim, Steve Jobs said, was an interface you would want to lick.',
    position: [2, -13.5],
    facing: 'south',
    display: 'vitrine',
    artifact: { kind: 'aqua', label: 'OK', prompt: 'CLICK' },
  },
  {
    id: 'slide',
    bay: 'III',
    index: '09',
    year: '2007',
    category: 'APPLE IPHONE',
    title: 'Slide to Unlock',
    description:
      'The first iPhone opened with a gesture drawn as an object: a knob in a groove, an arrow, a line of text. Glass had no keys, so the screen showed the hand how to touch it.',
    position: [5.5, -13.5],
    facing: 'south',
    display: 'vitrine',
    artifact: { kind: 'slide', label: 'slide to unlock', prompt: 'SLIDE' },
  },
  {
    id: 'leather',
    bay: 'III',
    index: '10',
    year: '2011',
    category: 'MAC OS X LION, ICAL',
    title: 'The Leather Button',
    description:
      'Stitched leather, brushed aluminium, a shadow under every edge. Interfaces borrowed whole materials, not only depth, so that new software would feel like the things it replaced.',
    position: [9, -13.5],
    facing: 'south',
    display: 'vitrine',
    artifact: { kind: 'leather', label: 'Today', prompt: 'PRESS' },
  },

  // IV. Dissolving: the form is taken away. East bay, facing west.
  {
    id: 'word',
    bay: 'IV',
    index: '11',
    year: '2013',
    category: 'APPLE IOS 7',
    title: 'The Button as a Word',
    description:
      'iOS 7 removed the outline, the gradient and the shadow. A button became a word in the system tint, and colour alone said it could be pressed. It assumed that people had learned to press long ago.',
    position: [8.8, -4.2],
    facing: 'west',
    display: 'wide',
    artifact: { kind: 'word', label: 'Done', prompt: 'TAP' },
  },
  {
    id: 'material',
    bay: 'IV',
    index: '12',
    year: '2014',
    category: 'GOOGLE MATERIAL DESIGN',
    title: 'The Paper Button',
    description:
      'Material Design brought depth back as physics instead of decoration: a flat sheet of colour that rises when pressed, casts a sharper shadow and answers with a ripple.',
    position: [8.8, -0.7],
    facing: 'west',
    display: 'wide',
    artifact: { kind: 'material', label: 'SAVE', prompt: 'CLICK' },
  },
  {
    id: 'quiet',
    bay: 'IV',
    index: '13',
    year: 'TODAY',
    category: 'CONTEMPORARY INTERFACES',
    title: 'The Quiet Button',
    description:
      'Many controls now have no container at all: a word, an arrow, a hairline that moves. Context, motion and consistency do the work that borders and shadows once did. The promise is the same; only its form has almost gone.',
    position: [8.8, 3],
    facing: 'west',
    display: 'wide',
    artifact: { kind: 'quiet', label: 'Continue', prompt: 'CONTINUE' },
  },
]

export const WALL_TEXTS: RoomWallText[] = [
  {
    id: 'intro',
    // The prologue: on the wall the visitor meets first, to the left of the entrance.
    facing: 'south',
    position: [-11.6, 8 + FACE],
    kicker: 'INTRODUCTION / 01',
    title: 'A button is a promise.',
    body: 'For decades, interface designers have been teaching people that a small surface on a screen can cause something to happen. Its appearance changed with every generation of software, but the contract remained surprisingly stable: this is a place where your intention becomes an action.',
  },
  {
    id: 'observation',
    // Bay IV: facing its buttons across the bay.
    facing: 'east',
    position: [5 + FACE, 4.6],
    kicker: 'OBSERVATION / 02',
    title: 'When the border disappeared.',
    body: 'As people became fluent in digital interfaces, controls needed fewer physical metaphors. Shadows faded. Gradients flattened. Sometimes even the container vanished. Familiarity became part of the interface itself.',
  },
  {
    id: 'question',
    // The epilogue, by the way out.
    facing: 'south',
    position: [5.4, 8 + FACE],
    kicker: 'QUESTION / 03',
    title: 'How little can a button look like a button?',
    body: 'The contemporary interface keeps testing the boundary between elegance and discoverability. Remove too much and the control becomes invisible. Add too much and it competes with the thing the user actually came to do.',
  },
]

