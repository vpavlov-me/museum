import { DOORS, localDoor, WALL_THICKNESS } from '../museum/roomRegistry'
import { RoomContents, useRoom } from '../museum/RoomContext'
import type { Rect } from '../museum/types'
import { INK, TYPE } from '../identity'
import { LightPool, Luminaire } from '../scene/Light'
import { floorGeometry, PALETTES } from '../scene/materials'
import { StaticMerge } from '../scene/StaticMerge'
import { Text } from './Text'
import { Wall } from './Wall'

const palette = PALETTES.passage
const t = WALL_THICKNESS
const STRIP = 0.08

/**
 * The passage between two rooms: the darkest, quietest kind of space in the museum, a
 * reset after a room. It heads north from the last room's door, meets a wall and turns
 * (east, or west with `turn="west"`); the next room opens off the far end, so neither
 * room sees the other.
 * Authored in the next room's coordinates. Its north wall is shared with that room,
 * each building its own half.
 */
export function TurnPassage({
  plan,
  entry: entryKey,
  number,
  title,
  kicker = 'NEXT',
  turn = 'east',
}: {
  plan: { a: Rect; b: Rect; height: number }
  /** The door into the next room, at the far end of the turn. */
  entry: keyof typeof DOORS
  /** The next room, as signed on the wall that turns the visitor. */
  number: string
  title: string
  /** Over the number: NEXT for a room, EXHIBITION for a wing. */
  kicker?: string
  turn?: 'east' | 'west'
}) {
  const { origin } = useRoom()
  const { a, b, height } = plan
  const midA = (a.minX + a.maxX) / 2
  const midB = (b.minZ + b.maxZ) / 2
  const entry = localDoor(DOORS[entryKey], origin)

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

        {turn === 'east' ? (
          <>
            <Wall axis="z" at={a.minX - t / 2} from={b.minZ} to={a.maxZ} height={height} palette={palette} />
            <Wall axis="z" at={a.maxX + t / 2} from={b.maxZ} to={a.maxZ} height={height} palette={palette} />
            <Wall axis="x" at={b.maxZ + t / 2} from={a.maxX + t} to={b.maxX + t} height={height} palette={palette} />
            <Wall axis="z" at={b.maxX + t / 2} from={b.minZ} to={b.maxZ + t} height={height} palette={palette} />
          </>
        ) : (
          <>
            <Wall axis="z" at={a.maxX + t / 2} from={b.minZ} to={a.maxZ} height={height} palette={palette} />
            <Wall axis="z" at={a.minX - t / 2} from={b.maxZ} to={a.maxZ} height={height} palette={palette} />
            <Wall axis="x" at={b.maxZ + t / 2} from={b.minX - t} to={a.minX - t} height={height} palette={palette} />
            <Wall axis="z" at={b.minX - t / 2} from={b.minZ} to={b.maxZ + t} height={height} palette={palette} />
          </>
        )}
        <Wall axis="x" at={b.minZ - t / 4} from={b.minX - t} to={b.maxX + t} height={height} thickness={t / 2} palette={palette} door={entry} />

        {/* One luminous line runs ahead, turns the corner with the visitor and stops at the door. */}
        <Luminaire position={[midA, height - 0.004, (a.maxZ - 0.6 + midB - STRIP / 2) / 2]} size={[STRIP, a.maxZ - 0.6 - midB + STRIP / 2]} palette={palette} />
        <Luminaire position={[(entry.center + midA) / 2, height - 0.004, midB]} size={[Math.abs(entry.center - midA) + STRIP / 2, STRIP]} palette={palette} />
      </StaticMerge>

      <RoomContents>
        {/* The wall that ends the first leg, and turns the visitor. */}
        <group position={[midA, 0, b.minZ + 0.012]}>
          <Text position={[-0.78, 2.02, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            {kicker}
          </Text>
          <Text position={[-0.8, 1.86, 0]} fontSize={0.42} letterSpacing={-0.03} color={INK.text} anchorX="left" anchorY="top">
            {`${number} →`}
          </Text>
          <Text position={[-0.78, 1.36, 0]} fontSize={0.075} letterSpacing={0.14} lineHeight={1.5} color={INK.body} anchorX="left" anchorY="top">
            {title}
          </Text>
        </group>

        {/* The next room is lit evenly and warmly; a little of it falls through the door. */}
        <LightPool position={[entry.center, 0.004, b.minZ + 0.9]} size={[2.6, 2]} color="#efe6d6" strength={0.12} />
      </RoomContents>
    </>
  )
}
