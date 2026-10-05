import { WALL_THICKNESS } from '../museum/roomRegistry'
import { floorGeometry, type Palette } from '../scene/materials'
import { Wall, type DoorOpening } from './Wall'

type WallSpec = { door?: DoorOpening; palette?: Palette }

/**
 * Floor, ceiling and walls of a rectangular space, in room-local coordinates.
 * Bounds are the inner faces; walls are built outside them. A side set to `null`
 * is left open because the neighbouring space already builds that shared wall
 * (the taller neighbour owns it, so it covers both ceilings).
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
  const outerMinZ = minZ - (north ? t : 0)
  const outerMaxZ = maxZ + (south ? t : 0)

  return (
    <group>
      <mesh position={[cx, 0, cz]} geometry={floorGeometry(width, length)} material={palette.floor} />

      <mesh position={[(outerMinX + outerMaxX) / 2, height + 0.09, (outerMinZ + outerMaxZ) / 2]} material={palette.ceiling}>
        <boxGeometry args={[outerMaxX - outerMinX, 0.18, outerMaxZ - outerMinZ]} />
      </mesh>

      {north && <Wall axis="x" at={minZ - t / 2} from={minX} to={maxX} height={height} palette={north.palette ?? palette} door={north.door} />}
      {south && <Wall axis="x" at={maxZ + t / 2} from={minX} to={maxX} height={height} palette={south.palette ?? palette} door={south.door} />}
      {west && (
        <Wall axis="z" at={minX - t / 2} from={outerMinZ} to={outerMaxZ} height={height} palette={west.palette ?? palette} door={west.door} />
      )}
      {east && (
        <Wall axis="z" at={maxX + t / 2} from={outerMinZ} to={outerMaxZ} height={height} palette={east.palette ?? palette} door={east.door} />
      )}
    </group>
  )
}
