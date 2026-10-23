import type { Palette } from '../scene/materials'
import { FIXTURE_MATERIAL } from '../scene/materials'

type Side = 'north' | 'south' | 'east' | 'west'

/** A stretch of a wall left without windows: on `side`, from `from` to `to` along its run (x or z). */
export type ClerestoryGap = { side: Side; from: number; to: number }

const FRAME = { rail: 0.07, mullion: 0.06, depth: 0.05, pane: 2.4, margin: 0.6 }

/**
 * A band of frosted windows under the ceiling, round a room's walls (v3, #48): daylight
 * you can see but not see through, between slim bronze mullions. It lights nothing; the
 * hall's light comes from the generated sky. Place it inside a StaticMerge.
 */
export function Clerestory({
  minX,
  maxX,
  minZ,
  maxZ,
  bottom,
  top,
  palette,
  gaps = [],
}: {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  bottom: number
  top: number
  palette: Palette
  gaps?: ClerestoryGap[]
}) {
  const sides: { side: Side; from: number; to: number }[] = [
    { side: 'north', from: minX, to: maxX },
    { side: 'south', from: minX, to: maxX },
    { side: 'west', from: minZ, to: maxZ },
    { side: 'east', from: minZ, to: maxZ },
  ]
  const runs = sides.flatMap(({ side, from, to }) => split(from + FRAME.margin, to - FRAME.margin, gaps.filter((gap) => gap.side === side)).map(([a, b]) => ({ side, a, b })))

  return (
    <>
      {runs.map(({ side, a, b }) => (
        <Band key={`${side}:${a}`} side={side} a={a} b={b} wall={side === 'north' ? minZ : side === 'south' ? maxZ : side === 'west' ? minX : maxX} bottom={bottom} top={top} palette={palette} />
      ))}
    </>
  )
}

/** The run [from, to] less the gaps, as the stretches that keep their windows. */
function split(from: number, to: number, gaps: ClerestoryGap[]) {
  let stretches: [number, number][] = [[from, to]]
  for (const gap of gaps) {
    stretches = stretches.flatMap(([a, b]) => {
      if (gap.to <= a || gap.from >= b) return [[a, b] as [number, number]]
      const out: [number, number][] = []
      if (gap.from - a > FRAME.pane / 2) out.push([a, gap.from])
      if (b - gap.to > FRAME.pane / 2) out.push([gap.to, b])
      return out
    })
  }
  return stretches
}

function Band({ side, a, b, wall, bottom, top, palette }: { side: Side; a: number; b: number; wall: number; bottom: number; top: number; palette: Palette }) {
  const length = b - a
  const height = top - bottom
  const panes = Math.max(1, Math.round(length / FRAME.pane))
  const step = length / panes
  // Into the room from the wall: +z from the north wall, -z from the south, and so on.
  const inward = side === 'north' || side === 'west' ? 1 : -1
  const alongX = side === 'north' || side === 'south'
  const at = (run: number, out: number, y: number): [number, number, number] => (alongX ? [run, y, wall + inward * out] : [wall + inward * out, y, run])
  const size = (run: number, y: number, out: number): [number, number, number] => (alongX ? [run, y, out] : [out, y, run])
  const mid = (a + b) / 2

  return (
    <>
      <mesh position={at(mid, 0.004, (bottom + top) / 2)} rotation={alongX ? [0, inward > 0 ? 0 : Math.PI, 0] : [0, (inward * Math.PI) / 2, 0]} material={palette.glow}>
        <planeGeometry args={[length, height]} />
      </mesh>
      {[bottom, top].map((y) => (
        <mesh key={y} position={at(mid, FRAME.depth / 2, y)} material={FIXTURE_MATERIAL}>
          <boxGeometry args={size(length + FRAME.mullion, FRAME.rail, FRAME.depth)} />
        </mesh>
      ))}
      {Array.from({ length: panes + 1 }, (_, i) => (
        <mesh key={i} position={at(a + i * step, FRAME.depth / 2, (bottom + top) / 2)} material={FIXTURE_MATERIAL}>
          <boxGeometry args={size(FRAME.mullion, height, FRAME.depth)} />
        </mesh>
      ))}
    </>
  )
}
