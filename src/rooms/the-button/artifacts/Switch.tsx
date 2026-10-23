import { useRef } from 'react'
import * as THREE from 'three'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BRASS, EBONITE, PORCELAIN, type ArtifactProps } from './shared'

const FACE: [number, number, number] = [Math.PI / 2, 0, 0]

/**
 * 1884. A quick-break rotary switch on a porcelain base, mounted on walnut in a frame.
 * Its origin is the centre of the mount, on the wall. Each press snaps the knob a quarter
 * turn: no travel in between, which was the point.
 */
export function Switch({ pressedAt }: ArtifactProps) {
  const knob = useRef<THREE.Group>(null)
  const turns = useRef({ seen: -Infinity, count: 0 })

  useRoomFrame((_, delta) => {
    const at = pressedAt.current ?? -Infinity
    if (at !== turns.current.seen) turns.current = { seen: at, count: turns.current.count + 1 }
    if (knob.current) knob.current.rotation.z = THREE.MathUtils.damp(knob.current.rotation.z, (turns.current.count * Math.PI) / 2, 60, delta)
  })

  return (
    <group>
      <mesh position={[0, 0, 0.012]} material={PORCELAIN} rotation={FACE}>
        <cylinderGeometry args={[0.13, 0.135, 0.05, 40]} />
      </mesh>
      <mesh position={[0, 0, 0.07]} material={BRASS} rotation={FACE}>
        <cylinderGeometry args={[0.085, 0.095, 0.07, 36]} />
      </mesh>
      <group ref={knob} position={[0, 0, 0.12]}>
        <mesh material={EBONITE}>
          <boxGeometry args={[0.17, 0.04, 0.04]} />
        </mesh>
        <mesh position={[0, 0, -0.015]} material={EBONITE} rotation={FACE}>
          <cylinderGeometry args={[0.03, 0.03, 0.03, 20]} />
        </mesh>
      </group>
    </group>
  )
}
