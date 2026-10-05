import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoom } from '../../../museum/RoomContext'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight } from '../../../scene/Light'
import { PALETTES } from '../../../scene/materials'
import { CARDS, FEED } from '../content'
import { smoothstep } from '../shared'

const BRASS = new THREE.MeshStandardMaterial({ color: '#6f6a5e', roughness: 0.4, metalness: 0.6 })
const ROPE = new THREE.MeshStandardMaterial({ color: '#5a2a26', roughness: 0.8 })
const { reveal: FRAME_MATERIAL } = PALETTES.accepted

type FadingText = THREE.Mesh & { fillOpacity: number }

const DOOR = { width: 1.7, height: 2.5 }
const FRAME = 0.06

/** The end of the route for now: a closed doorway to Room 03, behind a gallery rope. */
export function ClosedPassage() {
  const wall = FEED.minZ + 0.01
  const { origin } = useRoom()
  const texts = useRef<(FadingText | null)[]>([])
  const setText = (i: number) => (node: FadingText | null) => {
    texts.current[i] = node
  }

  // The message only resolves once you are close: from the far end of the feed it stays a dim shape.
  useFrame(({ camera }) => {
    const distance = Math.abs(camera.position.z - (origin[1] + FEED.minZ))
    const opacity = 0.15 + 0.85 * smoothstep(10, 5, distance)
    texts.current.forEach((text) => {
      if (text) text.fillOpacity = opacity
    })
  })

  useFocusTarget({ id: 'closed-passage', position: [0, 1.5, FEED.minZ + 0.5], distance: 3.4, facing: 0.6, card: CARDS.next, labelled: true })

  return (
    <>
      <mesh position={[0, DOOR.height / 2, wall]} material={PALETTES.passage.floor}>
        <planeGeometry args={[DOOR.width, DOOR.height]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (DOOR.width / 2 + FRAME / 2), DOOR.height / 2, wall + 0.015]} material={FRAME_MATERIAL}>
          <boxGeometry args={[FRAME, DOOR.height, 0.03]} />
        </mesh>
      ))}
      <mesh position={[0, DOOR.height + FRAME / 2, wall + 0.015]} material={FRAME_MATERIAL}>
        <boxGeometry args={[DOOR.width + FRAME * 2, FRAME, 0.03]} />
      </mesh>

      <group position={[0, 0, wall + 0.005]}>
        <Text ref={setText(0)} position={[-0.6, 1.95, 0]} fontSize={0.06} letterSpacing={0.16} color="#8f8c85" anchorX="left" anchorY="top">
          END OF FEED
        </Text>
        <Text ref={setText(1)} position={[-0.6, 1.8, 0]} fontSize={0.16} lineHeight={1.05} maxWidth={1.25} color="#efede6" anchorX="left" anchorY="top">
          You're all caught up.
        </Text>
        <Text ref={setText(2)} position={[-0.6, 1.36, 0]} fontSize={0.06} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
          {'03 / INTERFACE STATES\nIN PREPARATION'}
        </Text>
      </group>

      {/* Stanchions and rope: closed, in the museum's own vocabulary. */}
      {[-0.75, 0.75].map((x) => (
        <group key={x} position={[x, 0, FEED.minZ + 0.55]}>
          <mesh position={[0, 0.48, 0]} material={BRASS}>
            <cylinderGeometry args={[0.025, 0.025, 0.96, 12]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={BRASS}>
            <cylinderGeometry args={[0.13, 0.13, 0.02, 24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.88, FEED.minZ + 0.55]} rotation={[0, 0, Math.PI / 2]} material={ROPE}>
        <cylinderGeometry args={[0.018, 0.018, 1.5, 8]} />
      </mesh>

      {/* The only warm light in the room: the museum's own voice, at the end of the feed. */}
      <Downlight at={[0, FEED.minZ + 1.6]} aim={[0, 1.2, FEED.minZ]} ceiling={FEED.height} palette={PALETTES.accepted} angle={0.55} penumbra={0.7} intensity={14} />
    </>
  )
}
