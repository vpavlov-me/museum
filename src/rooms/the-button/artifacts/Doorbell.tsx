import { useRef } from 'react'
import type * as THREE from 'three'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BRASS, PORCELAIN, WALNUT, held, type ArtifactProps } from './shared'

const FACE: [number, number, number] = [Math.PI / 2, 0, 0]
const BOARD = 0.42

/** 1910s. A bell push: an ivory button in a brass rosette, on a square of walnut from a door frame. */
export function Doorbell({ pressedAt }: ArtifactProps) {
  const push = useRef<THREE.Group>(null)

  useRoomFrame(({ clock }) => {
    if (push.current) push.current.position.z = 0.05 - 0.016 * held(pressedAt, clock.elapsedTime, 0.5)
  })

  const y = BOARD / 2
  return (
    <group>
      <mesh position={[0, y, 0]} material={WALNUT}>
        <boxGeometry args={[BOARD, BOARD, 0.03]} />
      </mesh>
      <mesh position={[0, y, 0.025]} material={BRASS} rotation={FACE}>
        <cylinderGeometry args={[0.13, 0.14, 0.02, 48]} />
      </mesh>
      <mesh position={[0, y, 0.04]} material={BRASS} rotation={FACE}>
        <cylinderGeometry args={[0.07, 0.09, 0.016, 40]} />
      </mesh>
      <group ref={push} position={[0, y, 0.05]}>
        <mesh material={PORCELAIN} rotation={FACE}>
          <cylinderGeometry args={[0.042, 0.042, 0.03, 32]} />
        </mesh>
        <mesh position={[0, 0, 0.014]} material={PORCELAIN} scale={[1, 1, 0.35]}>
          <sphereGeometry args={[0.042, 24, 12]} />
        </mesh>
      </group>
    </group>
  )
}
