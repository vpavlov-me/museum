import type { Facing } from '../../components/WallText'
import type { ExhibitCardData } from '../../museum/types'

export type ArtifactStyle = 'bevel' | 'gloss' | 'flat' | 'quiet'

export type ButtonExhibit = ExhibitCardData & {
  id: string
  /** Plinth centre on the floor plane: [x, z], room-local. */
  position: [number, number]
  /** The way the plinth's front (and its label) faces. */
  facing: Facing
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

/*
 * The hall (#48), room-local metres: x -12…12, z -16…16, the lobby's portal at z = 16.
 * Free-standing walls 4 m high divide it into a prologue by the entrance, four bays
 * round the centre (I to the west, II and III to the north, IV to the east) and an
 * epilogue by the door back to the lobby. The centre is kept for the key visual.
 * Until the bays get their exhibits (D3), the four buttons stand in II, III and IV.
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
  {
    id: 'raised',
    index: '01',
    year: '1995',
    title: 'The Raised Button',
    category: 'AFFORDANCE',
    description: 'Depth, highlights and shadow made interaction explicit. The interface borrowed the visual language of physical controls so a new digital behavior could feel familiar.',
    position: [-7, -11.5],
    facing: 'south',
    artifact: { style: 'bevel', label: 'SUBMIT', prompt: 'PRESS' },
  },
  {
    id: 'skeuo',
    index: '02',
    year: '2007',
    title: 'The Tactile Button',
    category: 'SKEUOMORPHISM',
    description: 'Polish became material. Gradients, gloss and rounded surfaces suggested something you could almost touch through glass.',
    position: [7.5, -11.5],
    facing: 'south',
    artifact: { style: 'gloss', label: 'Continue', prompt: 'TAP' },
  },
  {
    id: 'flat',
    index: '03',
    year: '2013',
    title: 'The Flat Button',
    category: 'FLAT DESIGN',
    description: 'Decoration was stripped away and typography carried more of the hierarchy. The button became a rectangle, a word, sometimes only a color change.',
    position: [9, -0.5],
    facing: 'west',
    artifact: { style: 'flat', label: 'SAVE', prompt: 'CLICK' },
  },
  {
    id: 'quiet',
    index: '04',
    year: '2026',
    title: 'The Quiet Button',
    category: 'CONTEMPORARY UI',
    description: 'Mature interfaces often reduce the visual weight of controls. Context, motion and system consistency now do work that borders and shadows once had to do.',
    position: [9, 4],
    facing: 'west',
    artifact: { style: 'quiet', label: 'Continue', prompt: 'CONTINUE' },
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

