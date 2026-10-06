import { Text } from '@react-three/drei'
import { Wall } from '../../components/Wall'
import { DOORS, THRESHOLD, WALL_THICKNESS } from '../../museum/roomRegistry'
import { RoomContents } from '../../museum/RoomContext'
import { LightPool, Luminaire } from '../../scene/Light'
import { floorGeometry, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'

const palette = PALETTES.passage
const { a, b, height } = THRESHOLD
const t = WALL_THICKNESS
const STRIP = 0.08

/**
 * The threshold between the two rooms. Low, narrow and dim, it leaves Room 01
 * heading north, meets a wall and turns west; Room 02 opens only at the far end,
 * to the right. Neither room can see into the other. Authored in world coordinates.
 * Its north side is Room 02's south wall, built by that room.
 */
export function Passage() {
  const midA = (a.minX + a.maxX) / 2
  const midB = (b.minZ + b.maxZ) / 2
  const entry = DOORS.acceptedEntry

  return (
    <>
      <StaticMerge>
        <mesh position={[midA, 0, (a.minZ + a.maxZ) / 2]} geometry={floorGeometry(a.maxX - a.minX, a.maxZ - a.minZ)} material={palette.floor} />
        <mesh position={[(b.minX + b.maxX) / 2, 0, midB]} geometry={floorGeometry(b.maxX - b.minX, b.maxZ - b.minZ)} material={palette.floor} />

        {/* Ceilings: B's reaches over the corner, A's stops where B's begins. */}
        <mesh position={[midA, height + 0.09, (b.maxZ + t + a.maxZ) / 2]} material={palette.ceiling}>
          <boxGeometry args={[a.maxX - a.minX + 2 * t, 0.18, a.maxZ - b.maxZ - t]} />
        </mesh>
        <mesh position={[(b.minX - t + b.maxX + t) / 2, height + 0.09, (b.minZ + b.maxZ + t) / 2]} material={palette.ceiling}>
          <boxGeometry args={[b.maxX - b.minX + 2 * t, 0.18, b.maxZ - b.minZ + t]} />
        </mesh>

        <Wall axis="z" at={a.minX - t / 2} from={b.maxZ} to={a.maxZ} height={height} palette={palette} />
        <Wall axis="x" at={b.maxZ + t / 2} from={b.minX - t} to={a.minX - t} height={height} palette={palette} />
        <Wall axis="z" at={a.maxX + t / 2} from={b.minZ} to={a.maxZ} height={height} palette={palette} />
        <Wall axis="z" at={b.minX - t / 2} from={b.minZ} to={b.maxZ} height={height} palette={palette} />

        {/* One luminous line runs ahead, turns the corner with the visitor and stops at the door. */}
        <Luminaire position={[midA, height - 0.004, (a.maxZ - 0.6 + midB - STRIP / 2) / 2]} size={[STRIP, a.maxZ - 0.6 - midB + STRIP / 2]} palette={palette} />
        <Luminaire position={[(entry.x + midA + STRIP / 2) / 2, height - 0.004, midB]} size={[midA + STRIP / 2 - entry.x, STRIP]} palette={palette} />
      </StaticMerge>

      <RoomContents>
        {/* The wall that ends the first leg, and turns the visitor. */}
        <group position={[midA, 0, b.minZ + 0.012]}>
          <Text position={[-0.78, 2.02, 0]} fontSize={0.075} letterSpacing={0.16} color="#8f8c85" anchorX="left" anchorY="top">
            NEXT
          </Text>
          <Text position={[-0.8, 1.86, 0]} fontSize={0.42} letterSpacing={-0.03} color="#efede6" anchorX="left" anchorY="top">
            ← 02
          </Text>
          <Text position={[-0.78, 1.36, 0]} fontSize={0.075} letterSpacing={0.14} lineHeight={1.5} color="#bdbab2" anchorX="left" anchorY="top">
            {'THINGS WE\nSOMEHOW ACCEPTED'}
          </Text>
        </group>

        {/* Light from Room 02 spills through its door onto the threshold floor. */}
        <LightPool position={[entry.x, 0.004, b.minZ + 0.9]} size={[2.6, 2]} color="#dfe6e8" strength={0.12} />
      </RoomContents>
    </>
  )
}
