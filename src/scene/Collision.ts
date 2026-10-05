import { useEffect } from 'react'
import type * as THREE from 'three'
import { WALKABLE } from '../museum/roomRegistry'
import { useRoom } from '../museum/RoomContext'
import { contains, type Rect } from '../museum/types'

/*
 * Collision is deliberately simple: the visitor is a square of half-size `radius`.
 * Every sample point on that square must stand on walkable floor (rooms + doorways),
 * and the square must not overlap any obstacle. Obstacles are registered by rooms
 * and can be switched off at runtime (a banner that sinks, a gate that opens).
 */

const obstacles = new Map<string, Rect>()

const SAMPLES: [number, number][] = [
  [-1, -1], [1, -1], [-1, 1], [1, 1],
  [0, -1], [0, 1], [-1, 0], [1, 0],
]

export function canOccupy(x: number, z: number, radius: number) {
  for (const [sx, sz] of SAMPLES) {
    const px = x + sx * radius
    const pz = z + sz * radius
    if (!WALKABLE.some((area) => contains(area, px, pz))) return false
  }
  for (const o of obstacles.values()) {
    if (x + radius > o.minX && x - radius < o.maxX && z + radius > o.minZ && z - radius < o.maxZ) return false
  }
  return true
}

// Small sub-steps keep a fast frame from skipping through a 0.2 m wall.
const MAX_STEP = 0.05

/** Moves `position` by (dx, dz), sliding along whatever blocks it. Returns which axes were blocked. */
export function moveWithCollision(position: THREE.Vector3, dx: number, dz: number, radius: number) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / MAX_STEP))
  const sx = dx / steps
  const sz = dz / steps
  let blockedX = false
  let blockedZ = false

  for (let i = 0; i < steps; i++) {
    if (!blockedX && sx !== 0) {
      if (canOccupy(position.x + sx, position.z, radius)) position.x += sx
      else blockedX = true
    }
    if (!blockedZ && sz !== 0) {
      if (canOccupy(position.x, position.z + sz, radius)) position.z += sz
      else blockedZ = true
    }
  }

  return { blockedX, blockedZ }
}

/** Registers a room-local obstacle while mounted. Pass `null` to remove it (e.g. once a gate opens). */
export function useObstacle(id: string, local: Rect | null) {
  const { id: roomId, origin } = useRoom()
  const key = `${roomId}:${id}`
  const [ox, oz] = origin
  const minX = local ? local.minX + ox : NaN
  const maxX = local ? local.maxX + ox : NaN
  const minZ = local ? local.minZ + oz : NaN
  const maxZ = local ? local.maxZ + oz : NaN
  const enabled = local !== null

  useEffect(() => {
    if (!enabled) return
    obstacles.set(key, { minX, maxX, minZ, maxZ })
    return () => {
      obstacles.delete(key)
    }
  }, [key, enabled, minX, maxX, minZ, maxZ])
}
