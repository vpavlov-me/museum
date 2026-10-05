import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoom } from '../../../museum/RoomContext'
import { museumStore } from '../../../museum/store'
import { useFocusTarget } from '../../../scene/Interaction'
import { CARDS, FEED } from '../content'
import { CIRCLE, roundedRect, smoothstep } from '../shared'

const CARD = { width: 1.5, height: 1.05, spacing: 1.6, perSide: 12, y: 1.6 }
const SPAN = CARD.spacing * CARD.perSide
const TOP = FEED.maxZ - 0.4
const BOTTOM = TOP - SPAN
// Cards travel with the visitor at this fraction of their walking speed.
const DRIFT = 0.5

const IMAGE_COLORS = ['#5b6a73', '#7a6a55', '#5f6e5b', '#6d5a63', '#4f5d78', '#7d7466']
const PANEL = '#191918'
const INK = '#3b3a37'

type Slot = { side: -1 | 1; base: number; seed: number }

const SLOTS: Slot[] = Array.from({ length: CARD.perSide * 2 }, (_, i) => {
  const side = i % 2 === 0 ? -1 : 1
  const n = Math.floor(i / 2)
  return { side, base: TOP - 0.4 - n * CARD.spacing - (side === 1 ? CARD.spacing / 2 : 0), seed: i }
})

const wrap = (value: number, span: number) => ((value % span) + span) % span

/**
 * Exhibit 06. A corridor lined with posts. The posts drift along with the visitor,
 * so progress feels slower than walking, and new posts keep arriving from the dark.
 * No procedural world, just recycled cards: a convincing illusion is enough.
 */
export function InfiniteFeed() {
  const { id: roomId, origin } = useRoom()
  const cards = useRef<(THREE.Group | null)[]>([])
  const images = useRef<(THREE.Mesh | null)[]>([])
  const variants = useRef(new Int32Array(SLOTS.length).fill(-1))
  const imageMaterials = useMemo(() => IMAGE_COLORS.map((color) => new THREE.MeshBasicMaterial({ color })), [])
  const panelMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: PANEL }), [])
  const inkMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: INK }), [])

  // The card follows a little ahead of the visitor while they are in the corridor.
  const focusPoint = useRef<[number, number, number]>([0, 1.6, FEED.maxZ - 2])
  useFocusTarget({ id: 'feed', position: focusPoint.current, distance: 3, facing: 0.7, card: CARDS.feed })

  useFrame(({ camera }) => {
    const inRoom = museumStore.get().spaceId === roomId
    const localZ = camera.position.z - origin[1]
    const drift = inRoom ? Math.max(0, FEED.maxZ - localZ) * DRIFT : 0
    focusPoint.current[2] = THREE.MathUtils.clamp(localZ - 2, FEED.minZ + 5, FEED.maxZ - 2)

    SLOTS.forEach((slot, i) => {
      const card = cards.current[i]
      if (!card) return
      const travelled = TOP - slot.base + drift
      const z = TOP - wrap(travelled, SPAN)
      card.position.z = z
      // Fold in and out at both ends so the recycling is never seen.
      const edge = Math.min(z - BOTTOM, TOP - z)
      card.scale.y = Math.max(0.001, smoothstep(0, 1.2, edge))

      // Every time a card wraps around it comes back as a different post.
      const variant = (slot.seed + Math.floor(travelled / SPAN) * 5) % IMAGE_COLORS.length
      const image = images.current[i]
      if (image && variants.current[i] !== variant) {
        variants.current[i] = variant
        image.material = imageMaterials[variant]
      }
    })
  })

  return (
    <>
      {SLOTS.map((slot, i) => {
        const x = slot.side === -1 ? FEED.minX + 0.02 : FEED.maxX - 0.02
        const long = (slot.seed * 7) % 3
        return (
          <group
            key={i}
            ref={(node) => {
              cards.current[i] = node
            }}
            position={[x, CARD.y, slot.base]}
            rotation={[0, slot.side === -1 ? Math.PI / 2 : -Math.PI / 2, 0]}
          >
            <mesh geometry={roundedRect(CARD.width, CARD.height, 0.05)} material={panelMaterial} />
            <group position={[-CARD.width / 2 + 0.14, 0, 0.002]}>
              <mesh position={[0.06, 0.38, 0]} geometry={CIRCLE} scale={0.07} material={inkMaterial} />
              <mesh position={[0.42, 0.4, 0]} geometry={roundedRect(0.5, 0.045, 0.02)} material={inkMaterial} />
              <mesh
                ref={(node) => {
                  images.current[i] = node
                }}
                position={[(CARD.width - 0.28) / 2, -0.02, 0]}
                geometry={roundedRect(CARD.width - 0.28, 0.5, 0.03)}
                material={imageMaterials[slot.seed % IMAGE_COLORS.length]}
              />
              <mesh position={[0.5, -0.36, 0]} geometry={roundedRect(1, 0.04, 0.02)} material={inkMaterial} />
              <mesh position={[0.25 + long * 0.08, -0.43, 0]} geometry={roundedRect(0.5 + long * 0.16, 0.04, 0.02)} material={inkMaterial} />
            </group>
          </group>
        )
      })}
    </>
  )
}
