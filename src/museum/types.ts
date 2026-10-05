/** World-space floor point: [x, z]. */
export type Vec2 = [number, number]

/** Axis-aligned rectangle on the floor plane. */
export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number }

export const rect = (minX: number, maxX: number, minZ: number, maxZ: number): Rect => ({ minX, maxX, minZ, maxZ })

/** Rectangle from a centre point and full size. */
export const box = (x: number, z: number, width: number, depth: number): Rect =>
  rect(x - width / 2, x + width / 2, z - depth / 2, z + depth / 2)

export const contains = (r: Rect, x: number, z: number) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ

export const offsetRect = (r: Rect, [x, z]: Vec2): Rect => rect(r.minX + x, r.maxX + x, r.minZ + z, r.maxZ + z)

/** Gallery-label metadata for an exhibit: shown on physical labels, the overlay card and to screen readers. */
export type ExhibitCardData = {
  index: string
  year: string
  category: string
  title: string
  description: string
}

export type SpaceDefinition = {
  id: string
  /** Gallery number, e.g. '01'. Passages and the entrance have none. */
  number: string | null
  title: string
  /** Label shown in the HUD while the visitor stands in this space. */
  hudLabel: string
  /** World position of the space's local origin. Rooms are authored in local coordinates. */
  origin: Vec2
  /** Walkable floor, in world coordinates (inner faces of the walls). */
  bounds: Rect[]
}

/**
 * An opening in a wall that runs along x (every door in the current plan does).
 * World coordinates: `x` is the opening centre, `z` the wall centre line.
 */
export type DoorDefinition = {
  x: number
  z: number
  width: number
  height: number
  /** Wall thickness at the opening, if it differs from the standard wall. */
  thickness?: number
}
