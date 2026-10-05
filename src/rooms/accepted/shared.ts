import * as THREE from 'three'
import { useRoom } from '../../museum/RoomContext'
import { useMuseumStore } from '../../museum/store'

export { CIRCLE, roundedRect } from '../../scene/geometry'

/**
 * True while the visitor is outside this room. Room 02's interruptions quietly
 * reset once nobody is watching, so they are back on the next visit.
 */
export function useVisitorAway() {
  const { id } = useRoom()
  return useMuseumStore((state) => state.spaceId !== id)
}

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Deterministic pseudo-random in [0, 1): stable layouts without storing data by hand. */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
