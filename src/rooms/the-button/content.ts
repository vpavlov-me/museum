import type { Facing } from '../../components/WallText'
import type { ExhibitCardData } from '../../museum/types'

export type ArtifactStyle = 'bevel' | 'gloss' | 'flat' | 'quiet'

export type ButtonExhibit = ExhibitCardData & {
  id: string
  /** Plinth centre on the floor plane: [x, z]. */
  position: [number, number]
  side: 'left' | 'right'
  artifact: { style: ArtifactStyle; label: string; prompt: string }
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

// Room 01 shell, in metres. Inner faces of the walls.
export const ROOM = { halfWidth: 6, halfLength: 9, height: 5.2 }

export const EXHIBITS: ButtonExhibit[] = [
  {
    id: 'raised',
    index: '01',
    year: '1995',
    title: 'The Raised Button',
    category: 'AFFORDANCE',
    description: 'Depth, highlights and shadow made interaction explicit. The interface borrowed the visual language of physical controls so a new digital behavior could feel familiar.',
    position: [4.2, 5.5],
    side: 'right',
    artifact: { style: 'bevel', label: 'SUBMIT', prompt: 'PRESS' },
  },
  {
    id: 'skeuo',
    index: '02',
    year: '2007',
    title: 'The Tactile Button',
    category: 'SKEUOMORPHISM',
    description: 'Polish became material. Gradients, gloss and rounded surfaces suggested something you could almost touch through glass.',
    position: [-4.2, 1.6],
    side: 'left',
    artifact: { style: 'gloss', label: 'Continue', prompt: 'TAP' },
  },
  {
    id: 'flat',
    index: '03',
    year: '2013',
    title: 'The Flat Button',
    category: 'FLAT DESIGN',
    description: 'Decoration was stripped away and typography carried more of the hierarchy. The button became a rectangle, a word, sometimes only a color change.',
    position: [-4.2, -2.4],
    side: 'left',
    artifact: { style: 'flat', label: 'SAVE', prompt: 'CLICK' },
  },
  {
    id: 'quiet',
    index: '04',
    year: '2026',
    title: 'The Quiet Button',
    category: 'CONTEMPORARY UI',
    description: 'Mature interfaces often reduce the visual weight of controls. Context, motion and system consistency now do work that borders and shadows once had to do.',
    position: [4.2, -6.4],
    side: 'right',
    artifact: { style: 'quiet', label: 'Continue', prompt: 'CONTINUE' },
  },
]

export const WALL_TEXTS: RoomWallText[] = [
  {
    id: 'intro',
    facing: 'east',
    position: [-ROOM.halfWidth + 0.02, 8.6],
    kicker: 'INTRODUCTION / 01',
    title: 'A button is a promise.',
    body: 'For decades, interface designers have been teaching people that a small surface on a screen can cause something to happen. Its appearance changed with every generation of software, but the contract remained surprisingly stable: this is a place where your intention becomes an action.',
  },
  {
    id: 'observation',
    facing: 'west',
    position: [ROOM.halfWidth - 0.02, -8.3],
    kicker: 'OBSERVATION / 02',
    title: 'When the border disappeared.',
    body: 'As people became fluent in digital interfaces, controls needed fewer physical metaphors. Shadows faded. Gradients flattened. Sometimes even the container vanished. Familiarity became part of the interface itself.',
  },
  {
    id: 'question',
    facing: 'east',
    position: [-ROOM.halfWidth + 0.02, -0.55],
    kicker: 'QUESTION / 03',
    title: 'How little can a button look like a button?',
    body: 'The contemporary interface keeps testing the boundary between elegance and discoverability. Remove too much and the control becomes invisible. Add too much and it competes with the thing the user actually came to do.',
  },
]

// Floor thresholds between exhibit zones.
export const THRESHOLDS = [3.6, -0.4, -4.4]
