import { WALL_THICKNESS } from '../museum/roomRegistry'
import { Doorway, type DoorOpening } from './Doorway'

type WallSpec = { color?: string; door?: DoorOpening }

/**
 * Floor, ceiling and walls of a rectangular space, in room-local coordinates.
 * Bounds are the inner faces; walls are built outside them. A side set to `null`
 * is left open because the neighbouring space already builds that shared wall.
 */
export function RoomShell({
  minX,
  maxX,
  minZ,
  maxZ,
  height,
  floorColor = '#232221',
  wallColor = '#3a3936',
  ceilingColor = '#0d0d0d',
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
  floorColor?: string
  wallColor?: string
  ceilingColor?: string
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
      <mesh position={[cx, 0, cz]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color={floorColor} roughness={0.9} />
      </mesh>

      <mesh position={[(outerMinX + outerMaxX) / 2, height + 0.09, (outerMinZ + outerMaxZ) / 2]}>
        <boxGeometry args={[outerMaxX - outerMinX, 0.18, outerMaxZ - outerMinZ]} />
        <meshStandardMaterial color={ceilingColor} roughness={1} />
      </mesh>

      {north && (
        <Doorway from={minX} to={maxX} z={minZ - t / 2} height={height} color={north.color ?? wallColor} door={north.door} />
      )}
      {south && (
        <Doorway from={minX} to={maxX} z={maxZ + t / 2} height={height} color={south.color ?? wallColor} door={south.door} />
      )}
      {west && (
        <mesh position={[minX - t / 2, height / 2, (outerMinZ + outerMaxZ) / 2]}>
          <boxGeometry args={[t, height, outerMaxZ - outerMinZ]} />
          <meshStandardMaterial color={west.color ?? wallColor} roughness={0.92} />
        </mesh>
      )}
      {east && (
        <mesh position={[maxX + t / 2, height / 2, (outerMinZ + outerMaxZ) / 2]}>
          <boxGeometry args={[t, height, outerMaxZ - outerMinZ]} />
          <meshStandardMaterial color={east.color ?? wallColor} roughness={0.92} />
        </mesh>
      )}
    </group>
  )
}
