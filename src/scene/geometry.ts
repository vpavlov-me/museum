import * as THREE from 'three'

/** Unit circle facing +z, shared by every disc in the museum. */
export const CIRCLE = new THREE.CircleGeometry(1, 40)

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
