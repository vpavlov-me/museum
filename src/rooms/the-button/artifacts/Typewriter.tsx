import { useRef } from 'react'
import type * as THREE from 'three'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { ENAMEL, NICKEL, PORCELAIN, sincePress, type ArtifactProps } from './shared'

const KEY = { radius: 0.05, pitch: 0.13, travel: 0.022 }
const TILT = 0.42
const STRIKE = 0.16

/**
 * 1878. The top row of a Remington No. 2: six round keys, glass-faced in nickel rims, on a
 * bed of black enamel tilted towards the visitor. Each press strikes the next letter.
 */
export function Typewriter({ label, pressedAt }: ArtifactProps) {
  const letters = [...label]
  const keys = useRef<(THREE.Group | null)[]>([])
  const presses = useRef({ seen: -Infinity, count: -1 })

  useRoomFrame(({ clock }) => {
    const at = pressedAt.current ?? -Infinity
    if (at !== presses.current.seen) presses.current = { seen: at, count: presses.current.count + 1 }
    const struck = presses.current.count % letters.length
    const t = sincePress(pressedAt, clock.elapsedTime)
    keys.current.forEach((key, i) => {
      if (key) key.position.y = i === struck && t >= 0 && t < STRIKE ? -KEY.travel : 0
    })
  })

  const span = (letters.length - 1) * KEY.pitch
  return (
    <group>
      {/* The frame under the keyboard. */}
      <mesh position={[0, 0.06, 0]} material={ENAMEL}>
        <boxGeometry args={[span + 0.24, 0.12, 0.32]} />
      </mesh>
      <group position={[0, 0.13, 0.02]} rotation={[TILT, 0, 0]}>
        <mesh position={[0, -0.01, 0]} material={ENAMEL}>
          <boxGeometry args={[span + 0.2, 0.02, 0.26]} />
        </mesh>
        {letters.map((letter, i) => (
          <group key={i} position={[-span / 2 + i * KEY.pitch, 0, 0]}>
            {/* The lever's stem, then the key on it. */}
            <mesh position={[0, 0.02, 0]} material={NICKEL}>
              <cylinderGeometry args={[0.009, 0.009, 0.04, 8]} />
            </mesh>
            <group ref={(group) => void (keys.current[i] = group)} position={[0, 0, 0]}>
              <mesh position={[0, 0.05, 0]} material={NICKEL}>
                <cylinderGeometry args={[KEY.radius, KEY.radius, 0.022, 28]} />
              </mesh>
              <mesh position={[0, 0.052, 0]} material={PORCELAIN}>
                <cylinderGeometry args={[KEY.radius - 0.008, KEY.radius - 0.008, 0.022, 28]} />
              </mesh>
              <Text position={[0, 0.0635, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.05} color="#1b1a18" anchorX="center" anchorY="middle">
                {letter}
              </Text>
            </group>
          </group>
        ))}
      </group>
    </group>
  )
}
