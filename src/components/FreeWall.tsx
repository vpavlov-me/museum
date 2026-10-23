import { box } from '../museum/types'
import { useObstacle } from '../scene/Collision'
import type { Palette } from '../scene/materials'

/** A free-standing wall: along x at z = `at` (axis 'x'), or along z at x = `at` (axis 'z'). Room-local. */
export type FreeWall = { axis: 'x' | 'z'; at: number; from: number; to: number }

/** v3's free-standing walls (#48): 4 m high in 12 m halls, so the hall above them stays one space. */
export const FREE_WALL = { height: 4, thickness: 0.3 }

/** Where text set on a free-standing wall's face hangs: just off the face, on either side. */
export const FREE_WALL_FACE = FREE_WALL.thickness / 2 + 0.02

const GAP = 0.035

/**
 * The walls' bodies: plaster or concrete, floating on a shadow gap like the halls' own walls,
 * with a clean top. Place inside a StaticMerge.
 */
export function FreeWallBodies({ walls, palette }: { walls: FreeWall[]; palette: Palette }) {
  return (
    <>
      {walls.map((wall, i) => {
        const length = wall.to - wall.from
        const mid = (wall.from + wall.to) / 2
        const [x, z] = wall.axis === 'x' ? [mid, wall.at] : [wall.at, mid]
        const [sx, sz] = wall.axis === 'x' ? [length, FREE_WALL.thickness] : [FREE_WALL.thickness, length]
        return (
          <group key={i}>
            <mesh position={[x, GAP + (FREE_WALL.height - GAP) / 2, z]} material={palette.wall}>
              <boxGeometry args={[sx, FREE_WALL.height - GAP, sz]} />
            </mesh>
            <mesh position={[x, GAP / 2, z]} material={palette.skirting}>
              <boxGeometry args={[Math.max(0.01, sx - 0.024), GAP, Math.max(0.01, sz - 0.024)]} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

/** The walls in the way of the visitor. Outside any StaticMerge. */
export function FreeWallObstacles({ walls }: { walls: FreeWall[] }) {
  return (
    <>
      {walls.map((wall, i) => (
        <FreeWallObstacle key={i} wall={wall} index={i} />
      ))}
    </>
  )
}

function FreeWallObstacle({ wall, index }: { wall: FreeWall; index: number }) {
  const length = wall.to - wall.from
  const mid = (wall.from + wall.to) / 2
  useObstacle(`free-wall-${index}`, wall.axis === 'x' ? box(mid, wall.at, length, FREE_WALL.thickness) : box(wall.at, mid, FREE_WALL.thickness, length))
  return null
}
