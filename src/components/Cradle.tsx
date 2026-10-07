import { FIXTURE_MATERIAL } from '../scene/materials'

/** How deep an object sits into its cradle. */
export const CRADLE_SEAT = 0.025

/**
 * A low bronze base that holds a thin object upright on a plinth: the object stands in
 * it, `CRADLE_SEAT` deep, instead of hovering above the plinth. Its origin is the centre
 * of its underside, on the plinth's top.
 */
export function Cradle({ width, depth = 0.26, height = 0.06 }: { width: number; depth?: number; height?: number }) {
  return (
    <mesh position={[0, height / 2, 0]} material={FIXTURE_MATERIAL}>
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  )
}
