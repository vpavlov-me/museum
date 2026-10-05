import * as THREE from 'three'
import { useRoom } from '../../museum/RoomContext'
import { useMuseumStore } from '../../museum/store'

/**
 * True while the visitor is outside this room. Room 02's interruptions quietly
 * reset once nobody is watching, so they are back on the next visit.
 */
export function useVisitorAway() {
  const { id } = useRoom()
  return useMuseumStore((state) => state.spaceId !== id)
}

const roundedRects = new Map<string, THREE.ShapeGeometry>()

/** Flat rounded rectangle centred on the origin, shared between every use of the same size. */
export function roundedRect(width: number, height: number, radius: number) {
  const key = `${width}:${height}:${radius}`
  const cached = roundedRects.get(key)
  if (cached) return cached

  const w = width / 2
  const h = height / 2
  const r = Math.min(radius, w, h)
  const shape = new THREE.Shape()
  shape.moveTo(-w + r, -h)
  shape.lineTo(w - r, -h)
  shape.quadraticCurveTo(w, -h, w, -h + r)
  shape.lineTo(w, h - r)
  shape.quadraticCurveTo(w, h, w - r, h)
  shape.lineTo(-w + r, h)
  shape.quadraticCurveTo(-w, h, -w, h - r)
  shape.lineTo(-w, -h + r)
  shape.quadraticCurveTo(-w, -h, -w + r, -h)

  const geometry = new THREE.ShapeGeometry(shape, 6)
  roundedRects.set(key, geometry)
  return geometry
}

export const CIRCLE = new THREE.CircleGeometry(1, 40)

export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Deterministic pseudo-random in [0, 1): stable layouts without storing data by hand. */
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return s - Math.floor(s)
}
