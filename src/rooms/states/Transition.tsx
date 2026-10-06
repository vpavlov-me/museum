import { Text } from '@react-three/drei'
import { Wall } from '../../components/Wall'
import { DOORS, localDoor, TRANSITION_03, WALL_THICKNESS } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { LightPool, Luminaire } from '../../scene/Light'
import { floorGeometry, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { INK } from './content'

const palette = PALETTES.passage
const { a, b, height } = TRANSITION_03
const t = WALL_THICKNESS
const STRIP = 0.08

/**
 * The passage after the feed: the darkest, quietest space in the museum, a reset after
 * the density of Room 02. It heads north from the end of the feed, meets a wall and
 * turns east; Room 03 opens to the left at the far end, so neither room sees the other.
 * Authored in Room 03's coordinates. Its north wall is shared with Room 03's prologue,
 * each building its own half.
 */
export function StatesTransition() {
  const { origin } = useRoom()
  const midA = (a.minX + a.maxX) / 2
  const midB = (b.minZ + b.maxZ) / 2
  const entry = localDoor(DOORS.statesEntry, origin)

  return (
    <>
      <StaticMerge>
        <mesh position={[midA, 0, (a.minZ + a.maxZ) / 2]} geometry={floorGeometry(a.maxX - a.minX, a.maxZ - a.minZ)} material={palette.floor} />
        <mesh position={[(b.minX + b.maxX) / 2, 0, midB]} geometry={floorGeometry(b.maxX - b.minX, b.maxZ - b.minZ)} material={palette.floor} />

        {/* Ceilings: B's reaches over the corner, A's stops where B's begins. */}
        <mesh position={[midA, height + 0.09, (b.maxZ + t + a.maxZ) / 2]} material={palette.ceiling}>
          <boxGeometry args={[a.maxX - a.minX + 2 * t, 0.18, a.maxZ - b.maxZ - t]} />
        </mesh>
        <mesh position={[(b.minX + b.maxX) / 2, height + 0.09, (b.minZ - t / 2 + b.maxZ + t) / 2]} material={palette.ceiling}>
          <boxGeometry args={[b.maxX - b.minX + 2 * t, 0.18, b.maxZ - b.minZ + 1.5 * t]} />
        </mesh>

        <Wall axis="z" at={a.minX - t / 2} from={b.minZ} to={a.maxZ} height={height} palette={palette} />
        <Wall axis="z" at={a.maxX + t / 2} from={b.maxZ} to={a.maxZ} height={height} palette={palette} />
        <Wall axis="x" at={b.maxZ + t / 2} from={a.maxX + t} to={b.maxX + t} height={height} palette={palette} />
        <Wall axis="z" at={b.maxX + t / 2} from={b.minZ} to={b.maxZ + t} height={height} palette={palette} />
        <Wall axis="x" at={b.minZ - t / 4} from={b.minX - t} to={b.maxX + t} height={height} thickness={t / 2} palette={palette} door={entry} />

        {/* One luminous line runs ahead, turns the corner with the visitor and stops at the door. */}
        <Luminaire position={[midA, height - 0.004, (a.maxZ - 0.6 + midB - STRIP / 2) / 2]} size={[STRIP, a.maxZ - 0.6 - midB + STRIP / 2]} palette={palette} />
        <Luminaire position={[(entry.center + midA - STRIP / 2) / 2, height - 0.004, midB]} size={[entry.center - midA + STRIP / 2, STRIP]} palette={palette} />
      </StaticMerge>

      <RoomContents>
        {/* The wall that ends the first leg, and turns the visitor. */}
        <group position={[midA, 0, b.minZ + 0.012]}>
          <Text position={[-0.78, 2.02, 0]} fontSize={0.075} letterSpacing={0.16} color={INK.muted} anchorX="left" anchorY="top">
            NEXT
          </Text>
          <Text position={[-0.8, 1.86, 0]} fontSize={0.42} letterSpacing={-0.03} color={INK.text} anchorX="left" anchorY="top">
            03 →
          </Text>
          <Text position={[-0.78, 1.36, 0]} fontSize={0.075} letterSpacing={0.14} lineHeight={1.5} color={INK.body} anchorX="left" anchorY="top">
            {'INTERFACE\nSTATES'}
          </Text>
        </group>

        {/* Room 03's prologue is lit evenly and warmly; a little of it falls through the door. */}
        <LightPool position={[entry.center, 0.004, b.minZ + 0.9]} size={[2.6, 2]} color="#efe6d6" strength={0.12} />
      </RoomContents>
    </>
  )
}
