import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { motion } from '../museum/capabilities'
import { useRoomFrame } from '../museum/RoomContext'
import { FIXTURE_MATERIAL } from '../scene/materials'

type Side = 'north' | 'south' | 'east' | 'west'

/** A stretch of a wall left without windows: on `side`, from `from` to `to` along its run (x or z). */
export type ClerestoryGap = { side: Side; from: number; to: number }

const FRAME = { rail: 0.07, mullion: 0.06, depth: 0.05, pane: 2.4, margin: 0.6 }

/** Metres of window covered by one repeat of the leaves, across; the band's height covers it upright. */
const LEAF_TILE = 9.6

const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

/**
 * The shadows of palm fronds outside, on frosted glass (#48): drawn once on a canvas, no
 * image file. Three layers at three sizes, drawn small and stretched, so the fronds
 * furthest from the glass are the softest. It tiles across.
 */
function leafShadows() {
  const width = 1024
  const height = 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const out = canvas.getContext('2d')!
  out.fillStyle = '#ffffff'
  out.fillRect(0, 0, width, height)
  out.imageSmoothingEnabled = true
  out.imageSmoothingQuality = 'high'

  const layers = [
    { scale: 1 / 8, fronds: 7, ink: 'rgba(118, 132, 104, 0.22)', seed: 11 },
    { scale: 1 / 4, fronds: 5, ink: 'rgba(104, 118, 92, 0.26)', seed: 23 },
    { scale: 1 / 2, fronds: 3, ink: 'rgba(92, 104, 82, 0.3)', seed: 37 },
  ]
  for (const layer of layers) {
    const w = width * layer.scale
    const h = height * layer.scale
    const small = document.createElement('canvas')
    small.width = w
    small.height = h
    const ctx = small.getContext('2d')!
    ctx.strokeStyle = layer.ink
    ctx.lineCap = 'round'
    const random = seeded(layer.seed)
    for (let i = 0; i < layer.fronds; i++) {
      const x = random() * w
      const reach = (0.7 + random() * 0.6) * h
      const angle = Math.PI / 2 + (random() - 0.5) * 1.6
      // Each frond is drawn three times, a tile apart, so the strip wraps without a seam.
      for (const shift of [-w, 0, w]) frond(ctx, x + shift, -0.1 * h, reach, angle, (random() - 0.5) * 0.8, h / 40)
    }
    out.drawImage(small, 0, 0, width, height)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** One palm frond hanging into the glass: a curved rib with drooping leaflets on both sides. */
function frond(ctx: CanvasRenderingContext2D, x: number, y: number, length: number, angle: number, bend: number, line: number) {
  const point = (t: number) => {
    const a = angle + bend * t
    return [x + Math.cos(a) * length * t, y + Math.sin(a) * length * t, a] as const
  }
  ctx.lineWidth = line * 1.2
  ctx.beginPath()
  ctx.moveTo(x, y)
  for (let t = 0.05; t <= 1; t += 0.05) ctx.lineTo(point(t)[0], point(t)[1])
  ctx.stroke()
  for (let t = 0.12; t < 0.98; t += 0.045) {
    const [px, py, a] = point(t)
    const leaf = length * 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + length * 0.04
    for (const side of [-1, 1]) {
      const spread = a + side * 0.95
      ctx.lineWidth = line * (1.4 - t * 0.6)
      ctx.beginPath()
      ctx.moveTo(px, py)
      // The leaflet droops a little towards its tip.
      ctx.quadraticCurveTo(px + Math.cos(spread) * leaf * 0.6, py + Math.sin(spread) * leaf * 0.6, px + Math.cos(spread) * leaf + Math.cos(a) * leaf * 0.25, py + Math.sin(spread) * leaf + leaf * 0.2)
      ctx.stroke()
    }
  }
}

let glass: THREE.MeshBasicMaterial | null = null

/** The frosted glass, with the leaves' shadows on it: one material for every window band. */
function frostedGlass() {
  glass ??= new THREE.MeshBasicMaterial({ color: '#fdfbf7', map: leafShadows() })
  return glass
}

/**
 * The leaves move a little in the wind: the whole pattern drifts a few centimetres and
 * back, slowly. Nothing moves when less motion is asked for. Place it in RoomContents.
 */
export function LeafSway() {
  useRoomFrame(({ clock }) => {
    const map = glass?.map
    if (!map || motion.reduced) return
    const t = clock.elapsedTime
    map.offset.set(0.004 * Math.sin(t * 0.37) + 0.002 * Math.sin(t * 0.91 + 1), 0.008 * Math.sin(t * 0.53))
  })
  return null
}

/**
 * A band of frosted windows under the ceiling, round a room's walls (v3, #48): daylight
 * you can see but not see through, with the shadows of palms outside, between slim
 * bronze mullions. It lights nothing; the hall's light comes from the generated sky.
 * Place it inside a StaticMerge, and a LeafSway in the room's contents.
 */
export function Clerestory({
  minX,
  maxX,
  minZ,
  maxZ,
  bottom,
  top,
  gaps = [],
}: {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  bottom: number
  top: number
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
        <Band key={`${side}:${a}`} side={side} a={a} b={b} wall={side === 'north' ? minZ : side === 'south' ? maxZ : side === 'west' ? minX : maxX} bottom={bottom} top={top} />
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

function Band({ side, a, b, wall, bottom, top }: { side: Side; a: number; b: number; wall: number; bottom: number; top: number }) {
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
  // The glass keeps the leaves at one size whatever the band's length, and each band starts where its run does.
  const pane = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(length, height)
    const uv = geometry.attributes.uv
    for (let i = 0; i < uv.count; i++) uv.setX(i, (uv.getX(i) * length + a) / LEAF_TILE)
    return geometry
  }, [length, height, a])
  useEffect(() => () => pane.dispose(), [pane])

  return (
    <>
      <mesh position={at(mid, 0.004, (bottom + top) / 2)} rotation={alongX ? [0, inward > 0 ? 0 : Math.PI, 0] : [0, (inward * Math.PI) / 2, 0]} geometry={pane} material={frostedGlass()} />
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
