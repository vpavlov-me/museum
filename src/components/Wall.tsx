import { WALL_THICKNESS } from '../museum/roomRegistry'
import type { Palette } from '../scene/materials'

export type DoorOpening = {
  /** Centre of the opening along the wall. */
  center: number
  width: number
  height: number
}

const REVEAL = 0.06
/** A skirting board, proud of both faces. */
const SKIRTING = { height: 0.15, proud: 0.018 }
/** A dark band under the ceiling: the wall stops just short of it. */
const SHADOW_GAP = 0.045
/** Architrave: a flat frame around an opening, proud of both faces. */
const ARCHITRAVE = { width: 0.13, proud: 0.022 }

/** A solid stretch of wall with a skirting board at its foot and a shadow gap at its head, built along local x. */
function Segment({ from, to, height, thickness, palette }: { from: number; to: number; height: number; thickness: number; palette: Palette }) {
  if (to - from <= 0.001) return null
  const x = (from + to) / 2
  return (
    <>
      <mesh position={[x, height / 2, 0]} material={palette.wall}>
        <boxGeometry args={[to - from, height, thickness]} />
      </mesh>
      <mesh position={[x, SKIRTING.height / 2, 0]} material={palette.skirting}>
        <boxGeometry args={[to - from, SKIRTING.height, thickness + SKIRTING.proud * 2]} />
      </mesh>
      <mesh position={[x, height - SHADOW_GAP / 2, 0]} material={palette.reveal}>
        <boxGeometry args={[to - from, SHADOW_GAP, thickness + 0.004]} />
      </mesh>
    </>
  )
}

/**
 * A wall from `from` to `to` along its axis, centred on `at` across it, optionally
 * pierced by a door. `axis: 'x'` runs along x at z = `at`; `axis: 'z'` runs along z
 * at x = `at`. The opening gets a slim dark reveal on both faces and a threshold
 * strip, so passing between spaces reads as stepping through architecture.
 */
export function Wall({
  axis,
  at,
  from,
  to,
  height,
  palette,
  door,
  thickness = WALL_THICKNESS,
}: {
  axis: 'x' | 'z'
  at: number
  from: number
  to: number
  height: number
  palette: Palette
  door?: DoorOpening
  thickness?: number
}) {
  // Built along local x, then turned so that local x becomes world z.
  const placement =
    axis === 'x'
      ? { position: [0, 0, at] as [number, number, number] }
      : { position: [at, 0, 0] as [number, number, number], rotation: [0, -Math.PI / 2, 0] as [number, number, number] }

  if (!door) {
    return (
      <group {...placement}>
        <Segment from={from} to={to} height={height} thickness={thickness} palette={palette} />
      </group>
    )
  }

  const left = door.center - door.width / 2
  const right = door.center + door.width / 2
  const lintel = height - door.height

  return (
    <group {...placement}>
      <Segment from={from} to={left} height={height} thickness={thickness} palette={palette} />
      <Segment from={right} to={to} height={height} thickness={thickness} palette={palette} />
      {lintel > 0 && (
        <mesh position={[door.center, door.height + lintel / 2, 0]} material={palette.wall}>
          <boxGeometry args={[door.width, lintel, thickness]} />
        </mesh>
      )}

      {/* Reveal: jambs and head, slightly proud of both wall faces. */}
      {[left + REVEAL / 2, right - REVEAL / 2].map((x) => (
        <mesh key={x} position={[x, door.height / 2, 0]} material={palette.reveal}>
          <boxGeometry args={[REVEAL, door.height, thickness + 0.03]} />
        </mesh>
      ))}
      {lintel > 0 && (
        <mesh position={[door.center, door.height - REVEAL / 2, 0]} material={palette.reveal}>
          <boxGeometry args={[door.width, REVEAL, thickness + 0.03]} />
        </mesh>
      )}

      {/* Architrave: jambs and head on both faces, stopping on the skirting. */}
      {[left - ARCHITRAVE.width / 2, right + ARCHITRAVE.width / 2].map((x) => (
        <mesh key={`a${x}`} position={[x, door.height / 2, 0]} material={palette.trim}>
          <boxGeometry args={[ARCHITRAVE.width, door.height, thickness + ARCHITRAVE.proud * 2]} />
        </mesh>
      ))}
      {lintel > ARCHITRAVE.width && (
        <mesh position={[door.center, door.height + ARCHITRAVE.width / 2, 0]} material={palette.trim}>
          <boxGeometry args={[door.width + ARCHITRAVE.width * 2, ARCHITRAVE.width, thickness + ARCHITRAVE.proud * 2]} />
        </mesh>
      )}

      <mesh position={[door.center, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]} material={palette.threshold}>
        <planeGeometry args={[door.width, thickness + 0.3]} />
      </mesh>
    </group>
  )
}
