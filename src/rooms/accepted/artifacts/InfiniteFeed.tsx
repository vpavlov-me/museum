import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useRoom } from '../../../museum/RoomContext'
import { museumStore } from '../../../museum/store'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial } from '../../../scene/materials'
import { CARDS, FEED } from '../content'
import { CIRCLE, roundedRect, smoothstep } from '../shared'

const CARD = { width: 1.5, height: 1.05, spacing: 1.6, perSide: 12, y: 1.6 }
const SPAN = CARD.spacing * CARD.perSide
const TOP = FEED.maxZ - 0.4
const BOTTOM = TOP - SPAN
// Cards travel with the visitor at this fraction of their walking speed.
const DRIFT = 0.5

const IMAGE_COLORS = ['#5b6a73', '#7a6a55', '#5f6e5b', '#6d5a63', '#4f5d78', '#7d7466'].map((color) => new THREE.Color(color))
const PANEL = basicMaterial('#191918')
const INK = basicMaterial('#3b3a37')

type Slot = { side: -1 | 1; base: number; seed: number; long: number }

const SLOTS: Slot[] = Array.from({ length: CARD.perSide * 2 }, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1
  const n = Math.floor(i / 2)
  return { side, base: TOP - 0.4 - n * CARD.spacing - (side === 1 ? CARD.spacing / 2 : 0), seed: i, long: (i * 7) % 3 }
})

const wrap = (value: number, span: number) => ((value % span) + span) % span

// Card-local layout: content starts this far from the card's left edge, just in front of it.
const LEFT = -CARD.width / 2 + 0.14
const FRONT = 0.002

/** Avatar, name and first line of text: identical on every card, so they are one geometry. */
function inkGeometry() {
  const avatar = CIRCLE.clone().scale(0.07, 0.07, 1).translate(LEFT + 0.06, 0.38, FRONT)
  const name = roundedRect(0.5, 0.045, 0.02).clone().translate(LEFT + 0.42, 0.4, FRONT)
  const line = roundedRect(1, 0.04, 0.02).clone().translate(LEFT + 0.5, -0.36, FRONT)
  const geometry = mergeGeometries([avatar, name, line], false)
  ;[avatar, name, line].forEach((part) => part.dispose())
  return geometry
}

/**
 * Exhibit 06. A corridor lined with posts. The posts drift along with the visitor,
 * so progress feels slower than walking, and new posts keep arriving from the dark.
 * No procedural world, just recycled cards: a convincing illusion is enough.
 * Every part of every card is instanced, so the whole feed is four draw calls.
 */
export function InfiniteFeed() {
  const { id: roomId, origin } = useRoom()
  const panels = useRef<THREE.InstancedMesh>(null)
  const inks = useRef<THREE.InstancedMesh>(null)
  const lines = useRef<THREE.InstancedMesh>(null)
  const images = useRef<THREE.InstancedMesh>(null)
  const variants = useRef(new Int32Array(SLOTS.length).fill(-1))

  const geometries = useMemo(
    () => ({
      panel: roundedRect(CARD.width, CARD.height, 0.05),
      ink: inkGeometry(),
      line: roundedRect(1, 0.04, 0.02),
      image: roundedRect(CARD.width - 0.28, 0.5, 0.03).clone().translate(LEFT + (CARD.width - 0.28) / 2, -0.02, FRONT),
    }),
    [],
  )
  const imageMaterial = useMemo(() => new THREE.MeshBasicMaterial(), [])

  useEffect(
    () => () => {
      geometries.ink.dispose()
      geometries.image.dispose()
      imageMaterial.dispose()
    },
    [geometries, imageMaterial],
  )

  // Scratch objects for composing instance matrices.
  const scratch = useMemo(
    () => ({
      card: new THREE.Matrix4(),
      line: new THREE.Matrix4(),
      position: new THREE.Vector3(),
      scale: new THREE.Vector3(),
      turn: [-1, 1].map((side) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), side === -1 ? Math.PI / 2 : -Math.PI / 2)),
    }),
    [],
  )

  // The card follows a little ahead of the visitor while they are in the corridor.
  // It is the one exhibit without a label in the space: its subject only appears while walking.
  const focusPoint = useRef<[number, number, number]>([0, 1.6, FEED.maxZ - 2])
  useFocusTarget({ id: 'feed', position: focusPoint.current, distance: 3, facing: 0.7, card: CARDS.feed })

  useFrame(({ camera }) => {
    const inRoom = museumStore.get().spaceId === roomId
    const localZ = camera.position.z - origin[1]
    const drift = inRoom ? Math.max(0, FEED.maxZ - localZ) * DRIFT : 0
    focusPoint.current[2] = THREE.MathUtils.clamp(localZ - 2, FEED.minZ + 5, FEED.maxZ - 2)

    const [panel, ink, line, image] = [panels.current, inks.current, lines.current, images.current]
    if (!panel || !ink || !line || !image) return
    const { card: matrix, line: lineMatrix, position, scale, turn } = scratch

    SLOTS.forEach((slot, i) => {
      const travelled = TOP - slot.base + drift
      const z = TOP - wrap(travelled, SPAN)
      // Fold in and out at both ends so the recycling is never seen.
      const edge = Math.min(z - BOTTOM, TOP - z)
      const fold = Math.max(0.001, smoothstep(0, 1.2, edge))
      const x = slot.side === -1 ? FEED.minX + 0.02 : FEED.maxX - 0.02

      matrix.compose(position.set(x, CARD.y, z), turn[slot.side === -1 ? 0 : 1], scale.set(1, fold, 1))
      panel.setMatrixAt(i, matrix)
      ink.setMatrixAt(i, matrix)
      image.setMatrixAt(i, matrix)
      const width = 0.5 + slot.long * 0.16
      lineMatrix.makeScale(width, 1, 1).setPosition(LEFT + width / 2, -0.43, FRONT)
      line.setMatrixAt(i, lineMatrix.premultiply(matrix))

      // Every time a card wraps around it comes back as a different post.
      const variant = (slot.seed + Math.floor(travelled / SPAN) * 5) % IMAGE_COLORS.length
      if (variants.current[i] !== variant) {
        variants.current[i] = variant
        image.setColorAt(i, IMAGE_COLORS[variant])
        if (image.instanceColor) image.instanceColor.needsUpdate = true
      }
    })
    for (const mesh of [panel, ink, line, image]) mesh.instanceMatrix.needsUpdate = true
  })

  const count = SLOTS.length

  return (
    <>
      <instancedMesh ref={panels} args={[geometries.panel, PANEL, count]} frustumCulled={false} />
      <instancedMesh ref={inks} args={[geometries.ink, INK, count]} frustumCulled={false} />
      <instancedMesh ref={lines} args={[geometries.line, INK, count]} frustumCulled={false} />
      <instancedMesh ref={images} args={[geometries.image, imageMaterial, count]} frustumCulled={false} />
    </>
  )
}
