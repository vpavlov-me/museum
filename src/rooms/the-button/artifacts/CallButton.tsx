import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BRASS, EBONITE, held, sincePress, type ArtifactProps } from './shared'

const FACE: [number, number, number] = [Math.PI / 2, 0, 0]
const PLATE = { width: 0.3, height: 0.66 }
const LAMP_FOR = 6
const UNLIT = new THREE.Color('#5a3d1c')
const LIT = new THREE.Color('#ffb54a')

/**
 * 1900s. An elevator landing's brass plate, standing in its cradle: an engraved arrow over
 * an ebonite button, and above them the lamp that says the call has been heard.
 */
export function CallButton({ pressedAt }: ArtifactProps) {
  const button = useRef<THREE.Mesh>(null)
  const lamp = useMemo(() => new THREE.MeshStandardMaterial({ color: UNLIT, roughness: 0.2, emissive: LIT, emissiveIntensity: 0 }), [])
  useEffect(() => () => lamp.dispose(), [lamp])

  useRoomFrame(({ clock }) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    if (button.current) button.current.position.z = 0.03 - 0.012 * held(pressedAt, clock.elapsedTime, 0.2)
    const on = t >= 0 && t < LAMP_FOR ? Math.min(1, t * 8) * Math.min(1, (LAMP_FOR - t) * 2) : 0
    lamp.emissiveIntensity = 1.6 * on
    lamp.color.lerpColors(UNLIT, LIT, on)
  })

  const y = PLATE.height / 2
  return (
    <group>
      <mesh position={[0, y, 0]} material={BRASS}>
        <boxGeometry args={[PLATE.width, PLATE.height, 0.014]} />
      </mesh>
      <mesh position={[0, y + 0.2, 0.012]} material={lamp} rotation={FACE}>
        <cylinderGeometry args={[0.032, 0.036, 0.022, 24]} />
      </mesh>
      {/* The engraved arrow: a triangle cut into the plate. */}
      <mesh position={[0, y + 0.065, 0.0075]} rotation={[0, 0, Math.PI / 2]} material={EBONITE}>
        <circleGeometry args={[0.035, 3]} />
      </mesh>
      <mesh position={[0, y - 0.1, 0.02]} material={BRASS} rotation={FACE}>
        <cylinderGeometry args={[0.062, 0.066, 0.02, 32]} />
      </mesh>
      <mesh ref={button} position={[0, y - 0.1, 0.03]} material={EBONITE} rotation={FACE}>
        <cylinderGeometry args={[0.046, 0.046, 0.03, 32]} />
      </mesh>
    </group>
  )
}
