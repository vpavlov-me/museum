import { useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import type * as THREE from 'three'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, sincePress, type ArtifactProps } from './shared'

/**
 * 2007. Aqua-era pill: rounded, glossy, with a glassy highlight on the upper half.
 * A press squashes it like a soft object and lets it spring back with a little wobble.
 */
export function TactileButton({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const d = 0.24

  const body = useRef<THREE.Group>(null)
  const highlight = useRef<THREE.MeshBasicMaterial>(null)

  useRoomFrame(({ clock }) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    // Quick squash, then a damped spring back to rest.
    const v = t >= 0 && t < 2.5 ? (1 - Math.exp(-45 * t)) * Math.exp(-5.5 * t) * Math.cos(15 * t) : 0
    if (body.current) {
      body.current.scale.set(1 + 0.05 * v, 1 - 0.1 * v, 1 - 0.4 * v)
      body.current.position.z = -0.05 * v
    }
    if (highlight.current) highlight.current.opacity = 0.32 + 0.35 * Math.max(v, 0)
  })

  return (
    <group ref={body}>
      <RoundedBox args={[width, height, d]} radius={0.115} smoothness={6}>
        <meshPhysicalMaterial color="#2f7fd8" roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
      </RoundedBox>
      <mesh position={[0, 0.135, d / 2 + 0.003]}>
        <planeGeometry args={[width - 0.32, 0.11]} />
        <meshBasicMaterial ref={highlight} color="#ffffff" transparent opacity={0.32} depthWrite={false} />
      </mesh>
      <Text position={[0, -0.04, d / 2 + 0.006]} fontSize={0.17} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}
