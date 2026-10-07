import type { ReactNode } from 'react'
import { FIXTURE_MATERIAL } from '../scene/materials'

const POST = 0.035
const FOOT = { size: 0.24, height: 0.014 }
const BACKING = { margin: 0.03, depth: 0.014 }

/**
 * A reading stand: a slim post rising from a small foot to a sloped plate, which holds
 * a card or a label (its children, centred on the plate, facing local +z). `position`
 * is where the post meets the floor; `yaw` turns the stand to face the reader;
 * `height` is the plate's centre; `tilt` leans it back (negative: face up).
 */
export function Lectern({
  position,
  yaw = 0,
  height,
  tilt,
  width,
  plate,
  children,
}: {
  position: [number, number, number]
  yaw?: number
  height: number
  tilt: number
  /** The card's size: the plate is a little larger. */
  width: number
  plate: number
  children: ReactNode
}) {
  return (
    <group position={position} rotation={[0, yaw, 0]}>
      <mesh position={[0, FOOT.height / 2, 0]} material={FIXTURE_MATERIAL}>
        <boxGeometry args={[FOOT.size, FOOT.height, FOOT.size]} />
      </mesh>
      <mesh position={[0, height / 2, 0]} material={FIXTURE_MATERIAL}>
        <boxGeometry args={[POST, height, POST]} />
      </mesh>
      <group position={[0, height, 0]} rotation={[tilt, 0, 0]}>
        <mesh position={[0, 0, -BACKING.depth / 2 - 0.002]} material={FIXTURE_MATERIAL}>
          <boxGeometry args={[width + BACKING.margin, plate + BACKING.margin, BACKING.depth]} />
        </mesh>
        {children}
      </group>
    </group>
  )
}
