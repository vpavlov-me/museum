import { useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type * as THREE from 'three'
import { BUTTON, sincePress, type ArtifactProps } from './shared'

const IDLE = '#2f63f0'
const PRESSED = '#1d44c4'
const DONE = '#24314f'
const PRESS_FLASH = 0.14
const DONE_FOR = 1.8

/**
 * 2013. An unlit rectangle that ignores the room's light on purpose.
 * Its response has no depth and no easing: the color switches, the word changes.
 */
export function FlatButton({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const d = 0.03
  const face = useRef<THREE.MeshBasicMaterial>(null)
  const [done, setDone] = useState(false)

  useFrame(({ clock }) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    const pressing = t >= 0 && t < PRESS_FLASH
    const isDone = t >= PRESS_FLASH && t < DONE_FOR
    face.current?.color.set(pressing ? PRESSED : isDone ? DONE : IDLE)
    if (isDone !== done) setDone(isDone)
  })

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, d]} />
        <meshBasicMaterial ref={face} color={IDLE} />
      </mesh>
      <Text position={[0, 0, d / 2 + 0.002]} fontSize={0.14} letterSpacing={0.1} color="#ffffff" anchorX="center" anchorY="middle">
        {done ? `${label}D` : label}
      </Text>
    </group>
  )
}
