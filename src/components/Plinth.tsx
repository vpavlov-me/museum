import type * as THREE from 'three'
import { PLINTH_MATERIAL } from '../scene/materials'

/** A museum plinth standing on the floor, centred at the group origin: dark lacquer, or (v3) oak. */
export function Plinth({ width, height, depth, material = PLINTH_MATERIAL }: { width: number; height: number; depth: number; material?: THREE.Material }) {
  return (
    <mesh position={[0, height / 2, 0]} material={material}>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  )
}
