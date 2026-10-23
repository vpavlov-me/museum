import type { EssayChapter } from '../../components/ChapterWall'
import { FREE_WALL_FACE, type FreeWall } from '../../components/FreeWall'
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

/**
 * A chapter of the essay. The wall carries its title, its first paragraph and its quote,
 * set large; the text version carries all of it.
 */
export type Chapter = EssayChapter & {
  /** The zone it belongs to: P (prologue), the four bays, E (epilogue). */
  zone: 'P' | Bay | 'E'
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


export const FREE_WALLS: FreeWall[] = [
  { axis: 'x', at: 8, from: -12, to: -5 }, // prologue | I
  { axis: 'z', at: -5, from: -3, to: 5 }, // I
  { axis: 'x', at: -7, from: -10, to: -3 }, // II
  { axis: 'x', at: -7, from: 3, to: 10 }, // III
  { axis: 'z', at: 5, from: -3, to: 5 }, // IV
  { axis: 'x', at: 8, from: 5, to: 12 }, // IV | epilogue
]

const FACE = FREE_WALL_FACE

/**
 * The key visual (#48): a kinetic installation hung over the centre of the hall, between
 * the four bays. Its label stands on an oak lectern on the visitor's way in.
 */
export const KEY_VISUAL = {
  id: 'key-visual',
  index: '00',
  year: '2026',
  category: 'KINETIC INSTALLATION',
  title: 'Twenty-Four Frames',
  description:
    'In 1878 Eadweard Muybridge photographed a galloping horse with a row of cameras and showed a movement too quick for the eye. Here the same is done to a press: twenty-four frames of one click, from rest to the bottom and back, hung in a slow ring. The material changes along the row, from bevel to gel to flat colour to light, and the press passes through it like a wave.',
  /** Centre of the ring on the floor plane, room-local; the ring hangs above head height. */
  centre: [0, 0.5] as [number, number],
  /** The lectern with the label, south of the ring, facing the entrance. */
  lectern: [0, 5.6] as [number, number],
}

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

/*
 * The essay, "A button is a promise", in six chapters, one for each zone of the hall.
 * Each hangs on the wall that faces its bay's objects, so that the visitor turns from
 * the things to the words about them.
 */
export const ESSAY: Chapter[] = [
  {
    id: 'prologue',
    zone: 'P',
    kicker: 'PROLOGUE',
    title: 'A button is a promise.',
    paragraphs: [
      'Every day you press a few hundred buttons and notice almost none of them. That is the point. A button is one of the few things in an interface that is not information: it is a place where a wish becomes an act. You want something to happen, you touch a small marked area, and it does.',
      'Nothing about that is natural. A rectangle of light has no spring, no travel, no click. Everything we know about pressing it we learned from objects, then from pictures of objects, and at last from habit. This hall follows that education in four steps, from the brass and porcelain the idea came from to the buttons that have almost stopped looking like anything.',
      'Read it as the history of a promise. The form of the button changed every decade; the promise did not. Here, it says, what you meant will be taken seriously.',
      'Each bay holds the buttons of one age, and the wall facing them carries a chapter of this essay. The chapters run clockwise, but you may walk the hall in any order. A promise does not mind which way round you come to it.',
    ],
    quote: 'A button is the place where a wish becomes an act.',
    position: [-11.6, 8 + FACE],
    facing: 'south',
  },
  {
    id: 'chapter-1',
    zone: 'I',
    kicker: 'I / BEFORE THE SCREEN',
    title: 'The hand learns first.',
    paragraphs: [
      'Before there were screens, a button was a mechanism you could feel. A typewriter key travelled a few millimetres and swung a typebar against the paper. A light switch resisted, then gave way with a snap. A bell push did nothing at your fingertip and everything in another room.',
      'Out of these objects came the grammar that interfaces still speak. A control has a resting state and an active one. It answers at once, with a sound, a movement or a light. And it asks for very little: one finger, one motion, no explanation.',
      'The elevator call button added something less mechanical. Pressing it a second time does nothing, and almost everyone does it. A button, it turned out, is also a way of being heard, and people like to be heard twice.',
      'Each of these objects is honest about what it does. You can see the lever, the contact, the wire that runs to the bell. The control and the machine are the same thing, and learning one is learning the other. That honesty is what the screen would lose, and what designers would spend half a century trying to give back.',
    ],
    quote: 'A control has two positions and a sound between them.',
    position: [-5 - FACE, -2.6],
    facing: 'west',
  },
  {
    id: 'chapter-2',
    zone: 'II',
    kicker: 'II / DRAWING A PRESS',
    title: 'Light from the top left.',
    paragraphs: [
      'When the graphical interface arrived, the button lost its body. On the Xerox Star a command was a word in a thin rectangle, a frame that only said: point here. There was nothing to press, only something to select. Within fifteen years designers had drawn the body back, in pixels.',
      'The Macintosh rounded the corners and ringed the expected answer with a heavier border. Windows 95 lit every button from the top left and shaded its bottom right, so that a grey rectangle seemed to stand off the screen and to sink when clicked.',
      'These were not decorations. They were instructions written in light and shadow, the only words a flat screen had for saying that this, and not that, will move. A generation learned to read them so well that it stopped noticing it was reading.',
      'Drawn buttons also made a new kind of decision possible. The default button is a suggestion built into a shape: the system expects one answer and makes it the easiest to give. A small rounded border began a long history of interfaces that lean, gently or not, towards what someone wants us to do.',
    ],
    quote: 'Light and shadow were the only words a flat screen had for: this one moves.',
    position: [-3.4, -7 - FACE],
    facing: 'north',
  },
  {
    id: 'chapter-3',
    zone: 'III',
    kicker: 'III / THE MATERIAL AGE',
    title: 'Something to touch.',
    paragraphs: [
      'In 2001 the button became a thing you might want to touch. Aqua made it out of blue gel, with a highlight like a drop of water, and let the default one breathe. Six years later the iPhone had no keys at all, and its lock screen explained the gesture with a drawn object: a knob in a groove, an arrow, a line of text.',
      'Software went on to borrow whole materials: stitched leather, brushed aluminium, felt and paper. The aim was reassurance. A slab of glass that did things no object had ever done dressed itself in the textures of desks and diaries, so that nobody would feel lost.',
      'Skeuomorphism is often remembered as kitsch. It was also a kindness. Millions of people who had never used a computer learned to use one in their pocket, and the leather told them what kind of place they were in.',
      'It worked, and it could not last. Every new material was one more thing to draw and one more thing to read, and the people it was meant to reassure no longer needed reassuring.',
    ],
    quote: 'Glass dressed itself in leather so that nobody would feel lost.',
    position: [9.6, -7 - FACE],
    facing: 'north',
  },
  {
    id: 'chapter-4',
    zone: 'IV',
    kicker: 'IV / DISSOLVING',
    title: 'The form goes first.',
    paragraphs: [
      'In 2013 iOS 7 took the button apart. The outline went, then the gradient, then the shadow, and what remained was a word in the system colour. A year later Material Design brought depth back, but as behaviour rather than ornament: a sheet that rises when touched and answers with a ripple.',
      'Since then the container has kept thinning. Many controls are now a word, an arrow or a line that moves. Their meaning comes from where they are, from what they did last time, and from the consistency of everything around them.',
      'This is only possible because of everything in the bays behind you. The button can disappear because the habit of pressing is now stronger than any form it could take.',
      'It is also a risk. Flatness asks people to trust what they have already learned, and for most people, most of the time, the trust is well placed. But what is invisible to those who know is invisible to those who do not know yet: to a newcomer, an older eye or a tired hand, a word in blue may be just a word in blue.',
    ],
    quote: 'The button can disappear because the habit is stronger than any form.',
    position: [5 + FACE, 4.6],
    facing: 'east',
  },
  {
    id: 'epilogue',
    zone: 'E',
    kicker: 'EPILOGUE',
    title: 'What remains.',
    paragraphs: [
      'Take away the spring, the bevel, the gel, the leather and the outline, and something is still there: a place on a surface, a word that names what will happen, an answer that comes at once. That is the promise this hall began with, and it has outlived every form that carried it.',
      'Good buttons keep it plainly. They say what they will do, they do it, and they show that it is done. Bad ones break it, and no shape can make up for that.',
      'The next button may have no surface at all: a gesture, a glance, a sentence spoken aloud. It will still be judged by the oldest question an interface has to answer. When you meant something, did it happen?',
    ],
    quote: 'When you meant something, did it happen?',
    position: [5.4, 8 + FACE],
    facing: 'south',
  },
]
