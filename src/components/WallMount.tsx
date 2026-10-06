import type { ReactNode } from 'react'
import { FIXTURE_MATERIAL } from '../scene/materials'

/** How far a mounted panel stands proud of the wall, and the frame's visible border. */
export const MOUNT = { depth: 0.05, border: 0.03 }

/**
 * A shadow-box mount for a panel hung on a wall: a bronze tray, proud of the wall, with
 * the panel (its children, centred, facing local +z) set into its face. The group's
 * origin is on the wall face, at the panel's centre.
 */
export function WallMount({ width, height, children }: { width: number; height: number; children: ReactNode }) {
  return (
    <>
      <mesh position={[0, 0, MOUNT.depth / 2]} material={FIXTURE_MATERIAL}>
        <boxGeometry args={[width + MOUNT.border * 2, height + MOUNT.border * 2, MOUNT.depth]} />
      </mesh>
      <group position={[0, 0, MOUNT.depth + 0.001]}>{children}</group>
    </>
  )
}
