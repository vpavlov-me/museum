import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { PALETTES } from '../scene/materials'

const BRASS = new THREE.MeshStandardMaterial({ color: '#6f6a5e', roughness: 0.4, metalness: 0.6 })
const ROPE = new THREE.MeshStandardMaterial({ color: '#5a2a26', roughness: 0.8 })
const FRAME_MATERIAL = PALETTES.accepted.reveal

const DOOR = { width: 1.7, height: 2.5 }
const FRAME = 0.06

/**
 * A doorway that is not open yet: a dark leaf in a slim frame, a short note on it,
 * and a gallery rope in front. Stands against a wall facing south (+z); the group
 * origin is the foot of the door on the wall face, room-local.
 */
export function ClosedDoor({ position, lines }: { position: [number, number, number]; lines: { kicker: string; title: string; note: string } }) {
  return (
    <group position={position}>
      <mesh position={[0, DOOR.height / 2, 0]} material={PALETTES.passage.floor}>
        <planeGeometry args={[DOOR.width, DOOR.height]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR.width / 2 + FRAME / 2), DOOR.height / 2, 0.015]} material={FRAME_MATERIAL}>
          <boxGeometry args={[FRAME, DOOR.height, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, DOOR.height + FRAME / 2, 0.015]} material={FRAME_MATERIAL}>
        <boxGeometry args={[DOOR.width + FRAME * 2, FRAME, 0.03]} />
      </mesh>

      <group position={[-0.6, 0, 0.005]}>
        <Text position={[0, 1.95, 0]} fontSize={0.06} letterSpacing={0.16} color="#8f8c85" anchorX="left" anchorY="top">
          {lines.kicker}
        </Text>
        <Text position={[0, 1.8, 0]} fontSize={0.13} lineHeight={1.1} maxWidth={1.25} color="#efede6" anchorX="left" anchorY="top">
          {lines.title}
        </Text>
        <Text position={[0, 1.3, 0]} fontSize={0.06} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
          {lines.note}
        </Text>
      </group>

      {/* Stanchions and rope: closed, in the museum's own vocabulary. */}
      {[-0.75, 0.75].map((x) => (
        <group key={x} position={[x, 0, 0.55]}>
          <mesh position={[0, 0.48, 0]} material={BRASS}>
            <cylinderGeometry args={[0.025, 0.025, 0.96, 12]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={BRASS}>
            <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.88, 0.55]} rotation={[0, 0, Math.PI / 2]} material={ROPE}>
        <cylinderGeometry args={[0.018, 0.018, 1.5, 8]} />
      </mesh>
    </group>
  )
}
