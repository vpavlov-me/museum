import { useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import type * as THREE from 'three'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, sincePress, type ArtifactProps } from './shared'

const TRACK = { width: 1.66, height: 0.34 }
const KNOB = { width: 0.42, height: 0.28 }
const TRAVEL = TRACK.width - KNOB.width - 0.06

/**
 * 2007. The foot of the first iPhone's lock screen: a groove, a knob with an arrow, the
 * words. A press slides the knob across and lets it fall back, as an unfinished swipe does.
 */
export function Slide({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const knob = useRef<THREE.Group>(null)

  useRoomFrame(({ clock }) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    // Out in half a second, a beat at the end, back in a quarter.
    const out = t < 0 || !Number.isFinite(t) ? 0 : t < 0.5 ? easeInOut(t / 0.5) : t < 1.1 ? 1 : t < 1.35 ? 1 - easeInOut((t - 1.1) / 0.25) : 0
    if (knob.current) knob.current.position.x = -TRAVEL / 2 + TRAVEL * out
  })

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.02]} />
        <meshStandardMaterial color="#0b0b0b" roughness={0.2} />
      </mesh>
      <RoundedBox args={[TRACK.width, TRACK.height, 0.02]} radius={0.008} position={[0, 0, 0.012]}>
        <meshStandardMaterial color="#1d1d1f" roughness={0.35} />
      </RoundedBox>
      <Text position={[0.2, 0, 0.025]} fontSize={0.1} color="#8b8b8d" anchorX="center" anchorY="middle">
        {label}
      </Text>
      <group ref={knob} position={[-TRAVEL / 2, 0, 0.04]}>
        <RoundedBox args={[KNOB.width, KNOB.height, 0.04]} radius={0.018}>
          <meshStandardMaterial color="#d6d6d6" metalness={0.35} roughness={0.3} />
        </RoundedBox>
        <Text position={[0, 0, 0.022]} fontSize={0.14} color="#6f6f71" anchorX="center" anchorY="middle">
          →
        </Text>
      </group>
    </group>
  )
}

const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2)
