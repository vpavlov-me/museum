import { WALL_THICKNESS } from '../museum/roomRegistry'
import { floorGeometry, type Palette } from '../scene/materials'
import { Wall, type DoorOpening } from './Wall'

type WallSpec = {
  door?: DoorOpening
  palette?: Palette
  /**
   * Build only this room's half of a shared wall (north and south sides). The
   * neighbour builds the other half, so each face can take its own palette, and
   * one room can change its light without changing the room next door.
   */
  split?: boolean
}

/**
 * Floor, ceiling and walls of a rectangular space, in room-local coordinates.
 * Bounds are the inner faces; walls are built outside them. A side set to `null`
 * is left open because the neighbouring space already builds that shared wall
 * (the taller neighbour owns it, so it covers both ceilings), unless both build half.
 */
export function RoomShell({
  minX,
  maxX,
  minZ,
  maxZ,
  height,
  palette,
  north,
  south,
  east = {},
  west = {},
  floor = true,
}: {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  height: number
  palette: Palette
  north: WallSpec | null
  south: WallSpec | null
  east?: WallSpec | null
  west?: WallSpec | null
  /** False when the space lays its own floor (around an opening in it, say). */
  floor?: boolean
}) {
  const t = WALL_THICKNESS
  const width = maxX - minX
  const length = maxZ - minZ
  const cx = (minX + maxX) / 2
  const cz = (minZ + maxZ) / 2

  // Only reach over the corners where this shell owns the wall. Reaching into a
  // neighbour's wall would leave coplanar faces on its visible side (z-fighting).
  const outerMinX = minX - (west ? t : 0)
  const outerMaxX = maxX + (east ? t : 0)
  const reach = (side: WallSpec | null | undefined) => (side ? (side.split ? t / 2 : t) : 0)
  const outerMinZ = minZ - reach(north)
  const outerMaxZ = maxZ + reach(south)
  const half = (side: WallSpec) => (side.split ? t / 2 : t)

  return (
    <group>
      {floor && <mesh position={[cx, 0, cz]} geometry={floorGeometry(width, length)} material={palette.floor} />}

      <mesh position={[(outerMinX + outerMaxX) / 2, height + 0.09, (outerMinZ + outerMaxZ) / 2]} material={palette.ceiling}>
        <boxGeometry args={[outerMaxX - outerMinX, 0.18, outerMaxZ - outerMinZ]} />
      </mesh>

      {north && (
        <Wall axis="x" at={minZ - half(north) / 2} from={minX} to={maxX} height={height} thickness={half(north)} palette={north.palette ?? palette} door={north.door} />
      )}
      {south && (
        <Wall axis="x" at={maxZ + half(south) / 2} from={minX} to={maxX} height={height} thickness={half(south)} palette={south.palette ?? palette} door={south.door} />
      )}
      {west && (
        <Wall axis="z" at={minX - t / 2} from={outerMinZ} to={outerMaxZ} height={height} palette={west.palette ?? palette} door={west.door} />
      )}
      {east && (
        <Wall axis="z" at={maxX + t / 2} from={outerMinZ} to={outerMaxZ} height={height} palette={east.palette ?? palette} door={east.door} />
      )}
    </group>
  )
}
