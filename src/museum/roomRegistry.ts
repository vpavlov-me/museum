import { contains, offsetRect, rect, type DoorDefinition, type Rect, type SpaceDefinition, type Vec2 } from './types'

/*
 * Museum plan, in metres. North is -z, the general direction of travel.
 *
 *                          ┌──────┐
 *                          │ feed │  → closed passage (Room 03)
 *                        ┌─┴──────┴─┐
 *                        │ III WAIT │
 *                       ┌┴──────────┴┐
 *                       │ II ATTEND  │   CAPTCHA gate between II and III
 *                       └──┬─────┬───┘
 *                          │pause│
 *                       ┌──┴─────┴─────────┐
 *                       │ I INTERRUPT      │
 *                       └─┬────────────────┘
 *                         └─ B ───────────┐   threshold: low, narrow, two 90° turns
 *                                       A │
 *                                ┌────────┴──────────┐
 *                                │  01 THE BUTTON    │
 *                                └────────┬──────────┘
 *                                     ENTRANCE
 *
 * Walls are 0.2 m thick and sit outside each space's bounds, so neighbouring
 * spaces are separated by exactly one wall thickness. Every door sits in a wall
 * that runs along x; the turns happen inside the threshold.
 */

export const EYE_HEIGHT = 1.7
export const WALL_THICKNESS = 0.2

/** Room 02 is authored from the door it is entered through. */
const ACCEPTED_ORIGIN: Vec2 = [-12.9, -20.3]

/** A rectangular cell with its own ceiling height, room-local. */
export type Cell = Rect & { height: number }

const cell = (minX: number, maxX: number, minZ: number, maxZ: number, height: number): Cell => ({ ...rect(minX, maxX, minZ, maxZ), height })

/**
 * Room 02 as a sequence of offset cells, room-local. Each opening is shifted
 * sideways from the last, so the room never reads as one axis.
 */
export const ACCEPTED_CELLS = {
  interrupt: cell(-1.5, 9.5, -17, -0.1, 4.8),
  pause: cell(-1.5, 3.5, -21, -17.2, 2.8),
  attend: cell(-3, 7, -35, -21.2, 4),
  wait: cell(-2.5, 4.5, -46, -35.3, 3.4),
  feed: cell(-1.5, 1.5, -66.2, -46.2, 3),
}

/** The threshold between Room 01 and Room 02, in world coordinates (its origin is the world origin). */
export const THRESHOLD = {
  height: 2.6,
  /** Leaves Room 01 heading north. */
  a: rect(-7, -5, -18, -14),
  /** Turns west, towards the door into Room 02. */
  b: rect(-14.4, -5, -20.2, -18),
}

const inAccepted = (x: number, z: number) => ({ x: ACCEPTED_ORIGIN[0] + x, z: ACCEPTED_ORIGIN[1] + z })

export const DOORS = {
  entrance: { x: 0, z: 13.9, width: 2.4, height: 3 },
  buttonExit: { x: -6, z: -13.9, width: 1.8, height: 2.5 },
  acceptedEntry: { ...inAccepted(0, 0), width: 2, height: 2.4 },
  interruptExit: { ...inAccepted(0.8, -17.1), width: 1.8, height: 2.5 },
  attendEntry: { ...inAccepted(2.4, -21.1), width: 1.8, height: 2.5 },
  captcha: { ...inAccepted(0, -35.15), width: 2.7, height: 2.95, thickness: 0.3 },
  feed: { ...inAccepted(0, -46.1), width: 2, height: 2.6 },
} satisfies Record<string, DoorDefinition>

export const SPACES: SpaceDefinition[] = [
  {
    id: 'entrance',
    number: null,
    title: 'Entrance',
    hudLabel: 'ENTRANCE',
    origin: [0, 20],
    bounds: [rect(-4.5, 4.5, 14, 26)],
  },
  {
    id: 'the-button',
    number: '01',
    title: 'The Button',
    hudLabel: '01 / THE BUTTON',
    origin: [0, 0],
    bounds: [rect(-8.7, 8.7, -13.8, 13.8)],
  },
  {
    id: 'passage',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / 01 → 02',
    origin: [0, 0],
    bounds: [THRESHOLD.a, THRESHOLD.b],
  },
  {
    id: 'accepted',
    number: '02',
    title: 'Things We Somehow Accepted',
    hudLabel: '02 / THINGS WE SOMEHOW ACCEPTED',
    origin: ACCEPTED_ORIGIN,
    bounds: Object.values(ACCEPTED_CELLS).map((c) => offsetRect(c, ACCEPTED_ORIGIN)),
  },
]

export const SPAWN = {
  position: [0, EYE_HEIGHT, 24.6] as [number, number, number],
  spaceId: 'entrance',
}

const doorRect = (door: DoorDefinition): Rect => {
  const half = (door.thickness ?? WALL_THICKNESS) / 2 + 0.05
  return rect(door.x - door.width / 2, door.x + door.width / 2, door.z - half, door.z + half)
}

/** Every floor area the visitor may stand on: spaces plus the openings that join them. */
export const WALKABLE: Rect[] = [...SPACES.flatMap((space) => space.bounds), ...Object.values(DOORS).map(doorRect)]

export const getSpace = (id: string) => SPACES.find((space) => space.id === id) ?? null

export const spaceAt = (x: number, z: number) =>
  SPACES.find((space) => space.bounds.some((bounds) => contains(bounds, x, z))) ?? null

/** A door expressed along its wall in a room's local coordinates. */
export const localDoor = (door: DoorDefinition, origin: Vec2) => ({
  center: door.x - origin[0],
  width: door.width,
  height: door.height,
})
