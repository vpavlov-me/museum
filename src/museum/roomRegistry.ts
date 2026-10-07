import { contains, offsetRect, overlaps, rect, type DoorDefinition, type Rect, type SpaceDefinition, type Vec2 } from './types'

/*
 * Museum plan, in metres. North is -z, the general direction of travel.
 *
 *                    ┌────────┐
 *                    │colophon│  → back to the LOBBY
 *                    ┌┴────────┴────┐
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
 *                                ┌────────┴──────────┐   ┌─────────────────┐
 *                                │  01 THE BUTTON    │   │ INTERFACE       │
 *                                └────────┬──────────┘   │ ARCHAEOLOGY     │
 *                                     ENTRANCE           │ (02), its own   │
 *                                         │              │ wing: a turn,   │
 *                                         │              │ then four cells │
 *                                         │              └──────┬──────────┘
 *                         ┌───────────────┴─────────────────────┴──┐
 *                         │ [closed]        LOBBY                   │
 *                         └────────────────── EXIT ────────────────┘
 *
 * The LOBBY is where every visit starts and ends. Three entrances in its north wall:
 * a temporary exhibition (closed), the permanent exhibition (ENTRANCE, Rooms 01–03,
 * the colophon) and Interface Archaeology. See museum/exhibitions.ts.
 *
 * Walls are 0.2 m thick and sit outside each space's bounds, so neighbouring
 * spaces are separated by exactly one wall thickness. Every door sits in a wall
 * that runs along x; the turns happen inside the threshold.
 */

export const EYE_HEIGHT = 1.7
export const WALL_THICKNESS = 0.2

/** Room 02 is authored from the door it is entered through. */
const ACCEPTED_ORIGIN: Vec2 = [-6.9, -10.7]
/** Room 03 and the transition before it are authored from the door at the end of the feed. */
const STATES_ORIGIN: Vec2 = [-6.9, -77]
/** Interface Archaeology and the passage into it are authored from its door in the lobby's north wall. */
export const ARCHAEOLOGY_ORIGIN: Vec2 = [12, 26.1]

/** Dark Patterns (the temporary exhibition) and its passage are authored from its door in the lobby's north wall. */
export const DARK_ORIGIN: Vec2 = [-9, 26.1]

/** The lobby, in world coordinates: south of the permanent exhibition's entrance hall, across all three entrances. */
export const LOBBY = { minX: -14, maxX: 16, minZ: 26.2, maxZ: 36, height: 5 }

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
  /** Leaves Room 01 heading north, on its axis. */
  a: rect(-1, 1, -8.4, -4.4),
  /** Turns west, towards the door into Room 02. */
  b: rect(-8.4, 1, -10.6, -8.4),
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

/** The passage from the lobby into Interface Archaeology, local to it: the same low turn as before Room 03. */
export const ARCHAEOLOGY_PASSAGE = TRANSITION_03

/** The passage from the lobby into Dark Patterns: the same low turn, mirrored, turning west. */
export const DARK_PASSAGE = {
  height: 2.4,
  a: rect(-0.8, 0.8, -5.5, -0.1),
  b: rect(-8.2, 0.8, -7.7, -5.5),
}

/**
 * Dark Patterns as a sequence of cells, room-local: a welcome, a long checkout, two
 * doors (a big one into a small thank-you room, a small one into the cancellation flow),
 * the flow itself folded into four corridors, and a last room with the way back.
 */
export const DARK_CELLS = {
  welcome: cell(-12, -2, -15, -7.9, 4.2),
  checkout: cell(-20, -2, -21, -15.2, 3.4),
  stay: cell(-7.6, -2, -24, -21.2, 3.4),
  flow1: cell(-20, -8, -23.4, -21.2, 2.8),
  flow2: cell(-20, -8, -25.8, -23.6, 2.8),
  flow3: cell(-20, -8, -28.2, -26, 2.8),
  flow4: cell(-20, -8, -30.6, -28.4, 2.8),
  cancelled: cell(-20, -8, -36, -30.8, 3.2),
}

/**
 * Interface Archaeology as a sequence of cells, room-local: the lobby of a future
 * archive, a hall around an excavation, a low store, and a small dark room with a
 * reconstruction, whose far door leads back to the lobby.
 */
export const ARCHAEOLOGY_CELLS = {
  accession: cell(2, 12, -15, -7.9, 4.2),
  trench: cell(-2, 14, -33, -15.2, 5.2),
  store: cell(-2, 7, -47, -33.2, 3.2),
  reconstruction: cell(-2, 7, -57, -47.2, 3.4),
}

/** After Room 03: a low, warm room that closes the permanent exhibition, with the way back to the lobby. Local to Room 03. */
export const COLOPHON = cell(-6, 1, -101, -93.2, 3.2)

const inAccepted = (x: number, z: number) => ({ x: ACCEPTED_ORIGIN[0] + x, z: ACCEPTED_ORIGIN[1] + z })
const inStates = (x: number, z: number) => ({ x: STATES_ORIGIN[0] + x, z: STATES_ORIGIN[1] + z })
/** A point local to Dark Patterns, in world metres. */
export const inDark = (x: number, z: number) => ({ x: DARK_ORIGIN[0] + x, z: DARK_ORIGIN[1] + z })
/** A point local to Interface Archaeology, in world metres. */
export const inArchaeology = (x: number, z: number) => ({ x: ARCHAEOLOGY_ORIGIN[0] + x, z: ARCHAEOLOGY_ORIGIN[1] + z })

export const DOORS = {
  /** From the lobby into the permanent exhibition's entrance hall. */
  lobbyPermanent: { x: 0, z: 26.1, width: 2.4, height: 3.2 },
  entrance: { x: 0, z: 13.9, width: 2.4, height: 3 },
  buttonExit: { x: 0, z: -4.3, width: 1.8, height: 2.5 },
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
  /** From the lobby into the passage to Dark Patterns. */
  lobbyDark: { ...inDark(0, 0), width: 1.8, height: 2.6 },
  darkEntry: { ...inDark(-7, -7.8), width: 1.8, height: 2.4 },
  checkoutEntry: { ...inDark(-4, -15.1), width: 1.8, height: 2.6 },
  /** Confirmshaming: the big, lit door stays… */
  stayDoor: { ...inDark(-4.6, -21.1), width: 2.4, height: 3 },
  /** …and the small one, at the far end, leaves. */
  leaveDoor: { ...inDark(-18.9, -21.1), width: 1.1, height: 2.1 },
  flow12: { ...inDark(-9, -23.5), width: 1.3, height: 2.2 },
  flow23: { ...inDark(-19, -25.9), width: 1.3, height: 2.2 },
  flow34: { ...inDark(-9, -28.3), width: 1.3, height: 2.2 },
  cancelDoor: { ...inDark(-18.9, -30.7), width: 1.1, height: 2.1 },
  /** From the lobby into the passage to Interface Archaeology. */
  lobbyArchaeology: { ...inArchaeology(0, 0), width: 1.8, height: 2.6 },
  archaeologyEntry: { ...inArchaeology(7, -7.8), width: 1.8, height: 2.4 },
  trenchEntry: { ...inArchaeology(10.5, -15.1), width: 1.8, height: 2.6 },
  storeEntry: { ...inArchaeology(0, -33.1), width: 1.8, height: 2.4 },
  reconstructionEntry: { ...inArchaeology(5, -47.1), width: 1.6, height: 2.3 },
} satisfies Record<string, DoorDefinition>

export const SPACES: SpaceDefinition[] = [
  {
    id: 'lobby',
    number: null,
    title: 'Lobby',
    hudLabel: 'LOBBY',
    origin: [0, 0],
    bounds: [rect(LOBBY.minX, LOBBY.maxX, LOBBY.minZ, LOBBY.maxZ)],
  },
  {
    id: 'entrance',
    number: null,
    title: 'Entrance',
    hudLabel: 'PERMANENT EXHIBITION',
    origin: [0, 20],
    bounds: [rect(-4.5, 4.5, 14, 26)],
  },
  {
    id: 'the-button',
    number: '01',
    title: 'The Button',
    hudLabel: 'ROOM 01 / THE BUTTON',
    origin: [0, 4.8],
    bounds: [rect(-6, 6, -4.2, 13.8)],
  },
  {
    id: 'passage',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / ROOM 01 → 02',
    origin: [0, 0],
    bounds: [THRESHOLD.a, THRESHOLD.b],
  },
  {
    id: 'accepted',
    number: '02',
    title: 'Things We Somehow Accepted',
    hudLabel: 'ROOM 02 / THINGS WE SOMEHOW ACCEPTED',
    origin: ACCEPTED_ORIGIN,
    bounds: Object.values(ACCEPTED_CELLS).map((c) => offsetRect(c, ACCEPTED_ORIGIN)),
  },
  {
    id: 'transition-03',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / ROOM 02 → 03',
    origin: STATES_ORIGIN,
    bounds: [TRANSITION_03.a, TRANSITION_03.b].map((r) => offsetRect(r, STATES_ORIGIN)),
  },
  {
    id: 'states',
    number: '03',
    title: 'Interface States',
    hudLabel: 'ROOM 03 / INTERFACE STATES',
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
    id: 'colophon',
    number: null,
    title: 'Colophon',
    hudLabel: 'END OF THE PERMANENT EXHIBITION',
    origin: STATES_ORIGIN,
    bounds: [offsetRect(COLOPHON, STATES_ORIGIN)],
  },
  {
    id: 'dark-passage',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / DARK PATTERNS',
    origin: DARK_ORIGIN,
    bounds: [DARK_PASSAGE.a, DARK_PASSAGE.b].map((r) => offsetRect(r, DARK_ORIGIN)),
  },
  {
    id: 'dark-patterns',
    number: null,
    title: 'Dark Patterns',
    hudLabel: 'DARK PATTERNS',
    origin: DARK_ORIGIN,
    bounds: Object.values(DARK_CELLS).map((c) => offsetRect(c, DARK_ORIGIN)),
    zones: [
      { id: 'welcome', label: 'I / WELCOME', cells: ['welcome'] },
      { id: 'checkout', label: 'II / CHECKOUT', cells: ['checkout'] },
      { id: 'stay', label: 'III / THANK YOU FOR STAYING', cells: ['stay'] },
      { id: 'leaving', label: 'III / LEAVING', cells: ['flow1', 'flow2', 'flow3', 'flow4'] },
      { id: 'cancelled', label: 'IV / CANCELLED', cells: ['cancelled'] },
    ].map(({ id, label, cells }) => ({ id, label, bounds: cells.map((c) => offsetRect(DARK_CELLS[c as keyof typeof DARK_CELLS], DARK_ORIGIN)) })),
  },
  {
    id: 'archaeology-passage',
    number: null,
    title: 'Passage',
    hudLabel: 'PASSAGE / INTERFACE ARCHAEOLOGY',
    origin: ARCHAEOLOGY_ORIGIN,
    bounds: [ARCHAEOLOGY_PASSAGE.a, ARCHAEOLOGY_PASSAGE.b].map((r) => offsetRect(r, ARCHAEOLOGY_ORIGIN)),
  },
  {
    id: 'archaeology',
    number: null,
    title: 'Interface Archaeology',
    hudLabel: 'INTERFACE ARCHAEOLOGY',
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
]

/** Every visit starts in the lobby, by the front door, facing the three entrances. */
export const SPAWN = {
  position: [1, EYE_HEIGHT, 34.4] as [number, number, number],
  spaceId: 'lobby',
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

/** Every cell within `depth` steps of a cell (itself included): by default, what can be seen from it. */
export function visibleFrom(spaceId: string, cell: number, depth = VIEW_DEPTH): ReadonlySet<string> {
  const key = `${spaceId}:${depth}`
  let perCell = visibleCache.get(key)
  if (!perCell) visibleCache.set(key, (perCell = []))
  const cached = perCell[cell]
  if (cached) return cached
  const from = nodeId(spaceId, cell)
  const seen = new Set([from])
  let frontier = [from]
  for (let step = 0; step < depth; step++) {
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

/**
 * How far a space's architecture is kept: two doors beyond where its contents stop, so
 * a doorway at the edge of sight always shows a room, never the void. Further than that
 * a whole space (walls and all) is hidden: the wings stand side by side, and their
 * walls would otherwise be drawn through one another.
 */
export const ARCHITECTURE_DEPTH = VIEW_DEPTH + 2

/** Whether any cell of a space is within `depth` steps of where the visitor stands. */
export function spaceWithin(roomId: string, spaceId: string, cell: number, depth: number) {
  const near = visibleFrom(spaceId, cell, depth)
  const ids = NODE_IDS.get(roomId)
  if (!ids) return false
  for (let i = 0; i < ids.length; i++) if (near.has(ids[i])) return true
  return false
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
