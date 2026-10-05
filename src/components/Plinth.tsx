import { PLINTH_MATERIAL } from '../scene/materials'

/** A museum plinth standing on the floor, centred at the group origin. */
export function Plinth({ width, height, depth }: { width: number; height: number; depth: number }) {
  return (
    <mesh position={[0, height / 2, 0]} material={PLINTH_MATERIAL}>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  )
}
