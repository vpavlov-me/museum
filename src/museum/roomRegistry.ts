import { contains, offsetRect, overlaps, rect, type DoorDefinition, type Rect, type SpaceDefinition, type Vec2 } from './types'

/*
 * Museum plan, in metres. North is -z, the general direction of travel.
 *
 *                    ┌────────┐
 *                    │colophon│  → EXIT: the end of the visit
 *                 ┌──┴─────┬──┘
 *                 │IV RECON│
 *                 ├────────┴─┐
 *                 │ III STORE│
 *                ┌┴──────────┴──────┐
 *                │ II TRENCH  [pit] │      04 INTERFACE ARCHAEOLOGY
 *                └──────┬───────────┘
 *                       │I ACCESSION│
 *                     ┌─┴──┬────────┘
 *                     │  ┌─┘ passage: low, dark, one turn
 *                    ┌┴────┴────────┐
 *                    │  V SUCCESS   │
 *                    └───┬──────┬───┘
 *                        │IV OFF│
 *                     ┌──┴──────┴┐
 *                     │III ERROR │
 *                ┌────┴──────────┴──────┐
 *                │      II EMPTY        │
 *                └───────────┬─────┬────┘
 *                            │I LOAD│
 *                            ├──────┴─┐
 *                            │prologue│      03 INTERFACE STATES
 *                          ┌─┴──┬─────┘
 *                          │  ┌─┘ transition: low, dark, one turn
 *                          ┌──────┐
 *                          │ feed │
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
/** Room 03 and the transition before it are authored from the door at the end of the feed. */
const STATES_ORIGIN: Vec2 = [-12.9, -86.6]
/** Room 04, the passage before it and the colophon after it are authored from the door out of SUCCESS. */
export const ARCHAEOLOGY_ORIGIN: Vec2 = [STATES_ORIGIN[0] - 2.5, STATES_ORIGIN[1] - 93.1]

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

/**
 * The transition between Room 02 and Room 03, local to Room 03. A low, dark corridor
 * heads north from the end of the feed, meets a wall and turns east; Room 03 opens
 * to the left, at the far end.
 */
export const TRANSITION_03 = {
  height: 2.4,
  a: rect(-0.8, 0.8, -5.5, -0.1),
  b: rect(-0.8, 8.2, -7.7, -5.5),
}

/**
 * Room 03 as a sequence of cells, room-local, one per interface state. Each is a
 * different kind of space (low and unresolved, vast, wrong, dark, tall and bright),
 * and each opening is offset from the last.
 */
export const STATES_CELLS = {
  prologue: cell(-1, 10, -15, -7.9, 4.4),
  loading: cell(-1, 7, -27, -15.2, 4),
  empty: cell(-6, 12, -49, -27.2, 7.5),
  error: cell(-7, 3, -63, -49.2, 4.2),
  offline: cell(-4, 5, -77, -63.2, 3.8),
  success: cell(-9, 4, -93, -77.2, 8.5),
}

/** The passage between Room 03 and Room 04, local to Room 04: the same low turn as before Room 03. */
export const TRANSITION_04 = TRANSITION_03

/**
 * Room 04 as a sequence of cells, room-local: the lobby of a future archive, a hall
 * around an excavation, a low store, and a small dark room with a reconstruction.
 */
export const ARCHAEOLOGY_CELLS = {
  accession: cell(2, 12, -15, -7.9, 4.2),
  trench: cell(-2, 14, -33, -15.2, 5.2),
  store: cell(-2, 7, -47, -33.2, 3.2),
  reconstruction: cell(-2, 7, -57, -47.2, 3.4),
}

/** After the last room: a low, warm room with the credits and the way out. Local to Room 04. */
export const COLOPHON = cell(0, 7, -65, -57.2, 3.2)

const inAccepted = (x: number, z: number) => ({ x: ACCEPTED_ORIGIN[0] + x, z: ACCEPTED_ORIGIN[1] + z })
const inStates = (x: number, z: number) => ({ x: STATES_ORIGIN[0] + x, z: STATES_ORIGIN[1] + z })
/** A point local to Room 04, in world metres. */
export const inArchaeology = (x: number, z: number) => ({ x: ARCHAEOLOGY_ORIGIN[0] + x, z: ARCHAEOLOGY_ORIGIN[1] + z })

export const DOORS = {
  entrance: { x: 0, z: 13.9, width: 2.4, height: 3 },
  buttonExit: { x: -6, z: -13.9, width: 1.8, height: 2.5 },
  acceptedEntry: { ...inAccepted(0, 0), width: 2, height: 2.4 },
  interruptExit: { ...inAccepted(0.8, -17.1), width: 1.8, height: 2.5 },
  attendEntry: { ...inAccepted(2.4, -21.1), width: 1.8, height: 2.5 },
  captcha: { ...inAccepted(0, -35.15), width: 2.7, height: 2.95, thickness: 0.3 },
  feed: { ...inAccepted(0, -46.1), width: 2, height: 2.6 },
  acceptedExit: { ...inAccepted(0, -66.3), width: 1.6, height: 2.4 },
  statesEntry: { ...inStates(7, -7.8), width: 1.8, height: 2.4 },
  loadingEntry: { ...inStates(0.6, -15.1), width: 1.8, height: 2.6 },
  /** Held shut by a placeholder until the room has loaded. */
  loadingExit: { ...inStates(4.4, -27.1), width: 2.4, height: 3 },
  errorEntry: { ...inStates(-3.5, -49.1), width: 1.8, height: 2.6 },
  /** Plugged by a misplaced wall slab until the error is resolved. */
  errorExit: { ...inStates(0.5, -63.1), width: 1.8, height: 2.6 },
  /** Closed by a sliding panel until the connection is restored. */
  offlineExit: { ...inStates(-2.5, -77.1), width: 1.8, height: 2.6 },
  successExit: { ...inStates(-2.5, -93.1), width: 1.6, height: 2.5 },
  archaeologyEntry: { ...inArchaeology(7, -7.8), width: 1.8, height: 2.4 },
  trenchEntry: { ...inArchaeology(10.5, -15.1), width: 1.8, height: 2.6 },
  storeEntry: { ...inArchaeology(0, -33.1), width: 1.8, height: 2.4 },
  reconstructionEntry: { ...inArchaeology(5, -47.1), width: 1.6, height: 2.3 },
  archaeologyExit: { ...inArchaeology(5.5, -57.1), width: 1.6, height: 2.4 },
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
  {
    id: 'transition-03',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / 02 → 03',
    origin: STATES_ORIGIN,
    bounds: [TRANSITION_03.a, TRANSITION_03.b].map((r) => offsetRect(r, STATES_ORIGIN)),
  },
  {
    id: 'states',
    number: '03',
    title: 'Interface States',
    hudLabel: '03 / INTERFACE STATES',
    origin: STATES_ORIGIN,
    bounds: Object.values(STATES_CELLS).map((c) => offsetRect(c, STATES_ORIGIN)),
    zones: (
      [
        ['loading', 'I / LOADING'],
        ['empty', 'II / EMPTY'],
        ['error', 'III / ERROR'],
        ['offline', 'IV / OFFLINE'],
        ['success', 'V / SUCCESS'],
      ] as const
    ).map(([id, label]) => ({ id, label, bounds: [offsetRect(STATES_CELLS[id], STATES_ORIGIN)] })),
  },
  {
    id: 'transition-04',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / 03 → 04',
    origin: ARCHAEOLOGY_ORIGIN,
    bounds: [TRANSITION_04.a, TRANSITION_04.b].map((r) => offsetRect(r, ARCHAEOLOGY_ORIGIN)),
  },
  {
    id: 'archaeology',
    number: '04',
    title: 'Interface Archaeology',
    hudLabel: '04 / INTERFACE ARCHAEOLOGY',
    origin: ARCHAEOLOGY_ORIGIN,
    bounds: Object.values(ARCHAEOLOGY_CELLS).map((c) => offsetRect(c, ARCHAEOLOGY_ORIGIN)),
    zones: (
      [
        ['accession', 'I / ACCESSION'],
        ['trench', 'II / THE TRENCH'],
        ['store', 'III / THE STORE'],
        ['reconstruction', 'IV / RECONSTRUCTION'],
      ] as const
    ).map(([id, label]) => ({ id, label, bounds: [offsetRect(ARCHAEOLOGY_CELLS[id], ARCHAEOLOGY_ORIGIN)] })),
  },
  {
    id: 'colophon',
    number: null,
    title: 'Colophon',
    hudLabel: 'END OF EXHIBITION',
    origin: ARCHAEOLOGY_ORIGIN,
    bounds: [offsetRect(COLOPHON, ARCHAEOLOGY_ORIGIN)],
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

const inside = (bounds: Rect[], x: number, z: number) => {
  for (let i = 0; i < bounds.length; i++) if (contains(bounds[i], x, z)) return true
  return false
}

// Both run every frame for the visitor: loops rather than find/some, so they allocate nothing.
export function spaceAt(x: number, z: number) {
  for (let i = 0; i < SPACES.length; i++) if (inside(SPACES[i].bounds, x, z)) return SPACES[i]
  return null
}

export function zoneAt(space: SpaceDefinition, x: number, z: number) {
  const zones = space.zones ?? []
  for (let i = 0; i < zones.length; i++) if (inside(zones[i].bounds, x, z)) return zones[i]
  return null
}

/**
 * Which spaces open into which, derived from the doors: a door joins every space whose
 * floor reaches it. Spaces are only ever seen through their doors, so this is also
 * what can be seen from where.
 */
export const NEIGHBOURS: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const map = new Map(SPACES.map((space) => [space.id, new Set<string>()]))
  for (const door of Object.values(DOORS)) {
    const reach = doorRect(door)
    const joined = SPACES.filter((space) => space.bounds.some((bounds) => overlaps(bounds, reach)))
    for (const a of joined) for (const b of joined) if (a !== b) map.get(a.id)!.add(b.id)
  }
  return map
})()

/** A door expressed along its wall in a room's local coordinates. */
export const localDoor = (door: DoorDefinition, origin: Vec2) => ({
  center: door.x - origin[0],
  width: door.width,
  height: door.height,
})

/*
 * Sight lines, cell by cell. Every cell of every space is a node; doors (and open
 * floor between cells of one space, like the passages' turns) are edges. Contents are
 * drawn only within VIEW_DEPTH steps of the visitor's cell: a cell can be seen through
 * a door, and through the next one beyond it (Room 02's short pause lets the visitor
 * see from INTERRUPT straight into PROVE / ATTEND), never further.
 */
export const VIEW_DEPTH = 2

const nodeId = (spaceId: string, cell: number) => `${spaceId}:${cell}`
const touching = (a: Rect, b: Rect) => overlaps(rect(a.minX - 0.05, a.maxX + 0.05, a.minZ - 0.05, a.maxZ + 0.05), b)

const GRAPH: ReadonlyMap<string, ReadonlySet<string>> = (() => {
  const graph = new Map<string, Set<string>>()
  const link = (a: string, b: string) => {
    if (a === b) return
    if (!graph.has(a)) graph.set(a, new Set())
    if (!graph.has(b)) graph.set(b, new Set())
    graph.get(a)!.add(b)
    graph.get(b)!.add(a)
  }
  for (const space of SPACES) {
    space.bounds.forEach((cell, i) => {
      graph.set(nodeId(space.id, i), graph.get(nodeId(space.id, i)) ?? new Set())
      space.bounds.forEach((other, j) => {
        if (j > i && touching(cell, other)) link(nodeId(space.id, i), nodeId(space.id, j))
      })
    })
  }
  for (const door of Object.values(DOORS)) {
    const reach = doorRect(door)
    const joined = SPACES.flatMap((space) => space.bounds.flatMap((cell, i) => (overlaps(cell, reach) ? [nodeId(space.id, i)] : [])))
    for (const a of joined) for (const b of joined) link(a, b)
  }
  return graph
})()

/** Node ids of each space's cells, built once, so the per-frame checks below allocate nothing. */
const NODE_IDS: ReadonlyMap<string, readonly string[]> = new Map(SPACES.map((space) => [space.id, space.bounds.map((_, i) => nodeId(space.id, i))]))
const visibleCache = new Map<string, ReadonlySet<string>[]>()

/** Every cell that can be seen from a cell: itself, and up to VIEW_DEPTH doors away. */
export function visibleFrom(spaceId: string, cell: number): ReadonlySet<string> {
  let perCell = visibleCache.get(spaceId)
  if (!perCell) visibleCache.set(spaceId, (perCell = []))
  const cached = perCell[cell]
  if (cached) return cached
  const from = nodeId(spaceId, cell)
  const seen = new Set([from])
  let frontier = [from]
  for (let depth = 0; depth < VIEW_DEPTH; depth++) {
    const next: string[] = []
    for (const node of frontier) {
      for (const neighbour of GRAPH.get(node) ?? []) {
        if (seen.has(neighbour)) continue
        seen.add(neighbour)
        next.push(neighbour)
      }
    }
    frontier = next
  }
  perCell[cell] = seen
  return seen
}

/** Whether any of a room's cells (all of them, if none are named) can be seen from where the visitor stands. */
export function cellsVisible(roomId: string, cells: readonly number[] | undefined, spaceId: string, cell: number) {
  const visible = visibleFrom(spaceId, cell)
  const ids = NODE_IDS.get(roomId)
  if (!ids) return false
  if (cells) {
    for (let i = 0; i < cells.length; i++) if (visible.has(ids[cells[i]])) return true
    return false
  }
  for (let i = 0; i < ids.length; i++) if (visible.has(ids[i])) return true
  return false
}

/** Index of the cell (bounds rectangle) of a space that contains a point, or -1. */
export function cellAt(space: SpaceDefinition, x: number, z: number) {
  for (let i = 0; i < space.bounds.length; i++) if (contains(space.bounds[i], x, z)) return i
  return -1
}
