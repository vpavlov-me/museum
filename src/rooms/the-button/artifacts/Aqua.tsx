import { useRef } from 'react'
import type * as THREE from 'three'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { sincePress, type ArtifactProps } from './shared'

const PILL = { length: 1.2, radius: 0.27, depth: 0.42 }

/**
 * 2001. Aqua's default button: a pill of blue gel with light caught in its upper half.
 * It breathes slowly, as the default button did; a press squashes it like something soft.
 */
export function Aqua({ label, pressedAt }: ArtifactProps) {
  const body = useRef<THREE.Group>(null)
  const glow = useRef<THREE.MeshBasicMaterial>(null)

  useRoomFrame(({ clock }) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    const v = t >= 0 && t < 2.5 ? (1 - Math.exp(-45 * t)) * Math.exp(-5.5 * t) * Math.cos(15 * t) : 0
    if (body.current) body.current.scale.set(1 + 0.04 * v, 1 - 0.08 * v, 1 - 0.3 * v)
    // The pulse: about one breath every two seconds.
    if (glow.current) glow.current.opacity = 0.28 + 0.14 * (0.5 + 0.5 * Math.sin(clock.elapsedTime * Math.PI))
  })

  return (
    <group ref={body}>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1, PILL.depth]}>
        <capsuleGeometry args={[PILL.radius, PILL.length, 12, 32]} />
        <meshPhysicalMaterial color="#3a8ae6" roughness={0.18} clearcoat={1} clearcoatRoughness={0.06} />
      </mesh>
      <mesh position={[0, 0.12, PILL.radius * PILL.depth + 0.004]}>
        <planeGeometry args={[PILL.length + 0.1, 0.12]} />
        <meshBasicMaterial ref={glow} color="#ffffff" transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <Text position={[0, -0.03, PILL.radius * PILL.depth + 0.008]} fontSize={0.17} color="#0d2a52" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}
