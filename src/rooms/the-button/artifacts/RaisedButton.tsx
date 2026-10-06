import { useEffect, useMemo, useRef } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, sincePress, type ArtifactProps } from './shared'

const LIGHT = new THREE.Color('#f4f2ec')
const DARK = new THREE.Color('#4a4946')
// Held down for a beat, like a mouse button that is pressed and released.
const HOLD = 0.24

/**
 * 1995. Windows-era control: grey slab, light top-left edge, dark bottom-right edge.
 * When pressed it physically sinks, the bevel inverts and the label shifts by a pixel.
 */
export function RaisedButton({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const d = 0.18
  const edge = 0.045
  const z = d / 2 + 0.002

  const body = useRef<THREE.Group>(null)
  const text = useRef<THREE.Mesh>(null)
  const depth = useRef(0)
  const [lit, shade] = useMemo(() => [new THREE.MeshBasicMaterial({ color: LIGHT }), new THREE.MeshBasicMaterial({ color: DARK })], [])

  useEffect(
    () => () => {
      lit.dispose()
      shade.dispose()
    },
    [lit, shade],
  )

  useRoomFrame(({ clock }, delta) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    const down = t >= 0 && t < HOLD ? 1 : 0
    // Mechanical, almost instant travel.
    depth.current = THREE.MathUtils.damp(depth.current, down, 40, delta)
    const k = depth.current
    if (body.current) body.current.position.z = -0.07 * k
    const inverted = k > 0.5
    lit.color.copy(inverted ? DARK : LIGHT)
    shade.color.copy(inverted ? LIGHT : DARK)
    if (text.current) text.current.position.set(0.012 * k, -0.012 * k, z + 0.002)
  })

  return (
    <group>
      {/* Recessed housing the button sinks into. */}
      <mesh position={[0, 0, -d / 2 - 0.03]}>
        <boxGeometry args={[width + 0.1, height + 0.1, 0.06]} />
        <meshStandardMaterial color="#262624" roughness={0.9} />
      </mesh>

      <group ref={body}>
        <mesh>
          <boxGeometry args={[width, height, d]} />
          <meshStandardMaterial color="#c4c2bc" roughness={0.85} />
        </mesh>
        <mesh position={[0, height / 2 - edge / 2, z]} material={lit}>
          <planeGeometry args={[width, edge]} />
        </mesh>
        <mesh position={[-width / 2 + edge / 2, 0, z]} material={lit}>
          <planeGeometry args={[edge, height]} />
        </mesh>
        <mesh position={[0, -height / 2 + edge / 2, z + 0.001]} material={shade}>
          <planeGeometry args={[width, edge]} />
        </mesh>
        <mesh position={[width / 2 - edge / 2, 0, z + 0.001]} material={shade}>
          <planeGeometry args={[edge, height]} />
        </mesh>
        <Text ref={text} position={[0, 0, z + 0.002]} fontSize={0.15} letterSpacing={0.04} color="#111111" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    </group>
  )
}
