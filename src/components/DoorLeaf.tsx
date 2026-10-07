import * as THREE from 'three'
import type { ExhibitCardData } from '../museum/types'
import { INK } from '../identity'
import { useFocusTarget } from '../scene/Interaction'
import { basicMaterial, type Palette } from '../scene/materials'
import { StaticMerge } from '../scene/StaticMerge'
import { Text } from './Text'

/** The leaf: a dark, satin panel. */
const LEAF = new THREE.MeshStandardMaterial({ color: '#1d1c1b', roughness: 0.55 })

/**
 * A plain door set into a wall, closed, with a lit sign over it: the way out of an
 * exhibition, or out of the museum. It does not open; using it (E, or the tour's
 * action) takes the visitor where its sign says. `x` and `wall` (the wall's inner face)
 * are room-local; `facing` is the way the door faces, into the room.
 */
export function DoorLeaf({
  id,
  x,
  wall,
  palette,
  sign,
  prompt,
  card,
  onUse,
  width = 1.2,
  height = 2.3,
  facing = 'south',
}: {
  id: string
  x: number
  /** The wall's inner face, z. */
  wall: number
  palette: Palette
  sign: string
  prompt: string
  card: ExhibitCardData
  onUse: () => void
  width?: number
  height?: number
  facing?: 'south' | 'north'
}) {
  useFocusTarget({ id, position: [x, 1.3, wall], distance: 3, facing: 0.6, card, labelled: true, prompt, onInteract: onUse })

  return (
    <>
      <StaticMerge>
        <group position={[x, 0, wall]} rotation={[0, facing === 'north' ? Math.PI : 0, 0]}>
          <mesh position={[0, height / 2, 0]} material={LEAF}>
            <planeGeometry args={[width, height]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (width / 2 + 0.03), height / 2, 0.015]} material={palette.reveal}>
              <boxGeometry args={[0.06, height, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0, height + 0.03, 0.015]} material={palette.reveal}>
            <boxGeometry args={[width + 0.12, 0.06, 0.03]} />
          </mesh>
          <mesh position={[width / 2 - 0.22, 1.05, 0.006]} material={palette.reveal}>
            <boxGeometry args={[0.3, 0.035, 0.012]} />
          </mesh>
          <mesh position={[0, height + 0.3, 0.004]} material={basicMaterial('#1a1918')}>
            <planeGeometry args={[Math.max(0.5, sign.length * 0.075 + 0.2), 0.17]} />
          </mesh>
        </group>
      </StaticMerge>
      <Text position={[x, height + 0.3, wall + (facing === 'north' ? -0.006 : 0.006)]} rotation={[0, facing === 'north' ? Math.PI : 0, 0]} fontSize={0.075} letterSpacing={0.24} color={INK.text} anchorX="center" anchorY="middle">
        {sign}
      </Text>
    </>
  )
}
