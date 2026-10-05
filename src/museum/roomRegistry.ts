import { contains, rect, type DoorDefinition, type Rect, type SpaceDefinition, type Vec2 } from './types'

/*
 * Museum plan, in metres. The route runs towards -z:
 *
 *   ENTRANCE → 01 THE BUTTON → PASSAGE → 02 THINGS WE SOMEHOW ACCEPTED → feed → closed passage
 *
 * Walls are 0.2 m thick and sit outside each space's bounds, so neighbouring
 * spaces are separated by exactly one wall thickness.
 */

export const EYE_HEIGHT = 1.7
export const WALL_THICKNESS = 0.2

export const DOORS = {
  entrance: { x: 0, z: 13.9, width: 2.4, height: 3 },
  buttonExit: { x: -6, z: -13.9, width: 2.4, height: 2.8 },
  acceptedEntry: { x: -6, z: -24.1, width: 2.4, height: 2.6 },
  feed: { x: -6, z: -54.3, width: 2.4, height: 2.6 },
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
    origin: [-6, -19],
    bounds: [rect(-7.4, -4.6, -24, -14)],
  },
  {
    id: 'accepted',
    number: '02',
    title: 'Things We Somehow Accepted',
    hudLabel: '02 / THINGS WE SOMEHOW ACCEPTED',
    origin: [-6, -39.2],
    bounds: [
      // Main hall.
      rect(-12, 0, -54.2, -24.2),
      // The feed corridor that ends at the closed passage.
      rect(-7.5, -4.5, -74.4, -54.4),
    ],
  },
]

export const SPAWN = {
  position: [0, EYE_HEIGHT, 24.6] as [number, number, number],
  spaceId: 'entrance',
}

const doorRect = (door: DoorDefinition): Rect =>
  rect(door.x - door.width / 2, door.x + door.width / 2, door.z - WALL_THICKNESS / 2 - 0.05, door.z + WALL_THICKNESS / 2 + 0.05)

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
