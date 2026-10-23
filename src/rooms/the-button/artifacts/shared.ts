import type { RefObject } from 'react'
import * as THREE from 'three'
import { reflects } from '../../../scene/materials'

/** The screen-era buttons' common size, metres: drawn this size, shown smaller in a vitrine. */
export const BUTTON = { width: 1.9, height: 0.62 }

export type ArtifactProps = {
  label: string
  /** Clock time of the last press; -Infinity before the first one. */
  pressedAt: RefObject<number>
}

/** Seconds since the last press, or Infinity if it never happened. */
export const sincePress = (pressedAt: RefObject<number>, now: number) => now - (pressedAt.current ?? -Infinity)

/** A press held down for `hold` seconds: 1 while down, 0 otherwise. */
export const held = (pressedAt: RefObject<number>, now: number, hold: number) => {
  const t = sincePress(pressedAt, now)
  return t >= 0 && t < hold ? 1 : 0
}

/*
 * The materials of the objects before the screen, shared by all of them: brass, nickel,
 * porcelain or ivory, ebonite, black enamel and walnut. Metal and glaze take the hall's reflections.
 */
export const BRASS = reflects(new THREE.MeshStandardMaterial({ color: '#d1ac70', metalness: 0.7, roughness: 0.36 }))
export const NICKEL = reflects(new THREE.MeshStandardMaterial({ color: '#c9c6bf', metalness: 0.9, roughness: 0.25 }))
export const PORCELAIN = reflects(new THREE.MeshStandardMaterial({ color: '#f1ede4', roughness: 0.28 }))
export const EBONITE = reflects(new THREE.MeshStandardMaterial({ color: '#161514', roughness: 0.35 }))
export const ENAMEL = reflects(new THREE.MeshStandardMaterial({ color: '#1b1a18', roughness: 0.3, metalness: 0.2 }))
export const WALNUT = new THREE.MeshStandardMaterial({ color: '#5a4230', roughness: 0.6 })

/** A rounded rectangle's outline as a flat ring, `line` thick, for buttons drawn rather than built. */
export function roundedOutline(width: number, height: number, radius: number, line: number) {
  const shape = roundedShape(width, height, radius)
  shape.holes.push(roundedShape(width - 2 * line, height - 2 * line, Math.max(0, radius - line)))
  return new THREE.ShapeGeometry(shape, 8)
}

/** A filled rounded rectangle, centred. */
export function roundedRect(width: number, height: number, radius: number) {
  return new THREE.ShapeGeometry(roundedShape(width, height, radius), 8)
}

function roundedShape(width: number, height: number, radius: number) {
  const x = -width / 2
  const y = -height / 2
  const r = Math.min(radius, width / 2, height / 2)
  const shape = new THREE.Shape()
  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + r)
  shape.lineTo(x + width, y + height - r)
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  shape.lineTo(x + r, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}
