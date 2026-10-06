import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSound, useSoundLoop } from '../../../audio/useSound'
import { ChapterMark, type FadingText } from '../../../components/ChapterMark'
import { Text } from '../../../components/Text'
import { DOORS, localDoor } from '../../../museum/roomRegistry'
import { useActivity, useRoom, useRoomFrame } from '../../../museum/RoomContext'
import { box, rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { LightPool } from '../../../scene/Light'
import { basicMaterial, STATES_COLORS } from '../../../scene/materials'
import { CARDS, CELLS, CHAPTERS, INK } from '../content'
import { smoothstep, stateZoneNow } from '../shared'

const cell = CELLS.loading
const DOOR_Z = cell.minZ - 0.1
const BARRIER = { width: 2.36, height: 1.15, depth: 0.16 }
const BENCH = { x: 3, z: -20.6, width: 2.2, height: 0.45, depth: 0.5 }
const TEXT = { x: cell.maxX - 0.02, top: 3.2, start: -24.7 }

/**
 * Authored progress: quick at first, then the familiar stall at 93%, a jump to 99%
 * and a second stall before it finishes. [seconds since arrival, progress].
 */
const PROGRESS: [number, number][] = [
  [0, 0],
  [0.6, 0.12],
  [1.6, 0.41],
  [2.8, 0.72],
  [4.2, 0.93],
  [7.2, 0.93],
  [8.2, 0.99],
  [9.4, 0.99],
  [9.7, 1],
]

function progressAt(t: number) {
  for (let i = 1; i < PROGRESS.length; i++) {
    const [t1, p1] = PROGRESS[i]
    if (t < t1) {
      const [t0, p0] = PROGRESS[i - 1]
      return p0 + (p1 - p0) * smoothstep(t0, t1, t)
    }
  }
  return 1
}

type Vec3 = [number, number, number]
/** A piece of the room that has not loaded: `becomes` its real colour, or null if it disappears. */
type Placeholder = { position: Vec3; size: Vec3; resolveAt: number; becomes: string | null }

const WALL = STATES_COLORS.wall
const BENCH_COLOR = '#262523'

/** Walls, a bench, and bars standing in for text: lit like the room, so once resolved they are the room. */
const SOLIDS: Placeholder[] = [
  // Wall panels along the west wall, from the entrance onwards.
  { position: [cell.minX + 0.02, 1.7, -17.3], size: [0.04, 3.2, 2.5], resolveAt: 0.2, becomes: WALL },
  { position: [cell.minX + 0.02, 1.7, -20.4], size: [0.04, 3.2, 2.5], resolveAt: 0.45, becomes: WALL },
  { position: [cell.minX + 0.02, 1.7, -23.5], size: [0.04, 3.2, 2.5], resolveAt: 0.7, becomes: WALL },
  // And the stretch of east wall nearest the exit.
  { position: [cell.maxX - 0.02, 1.7, -17.3], size: [0.04, 3.2, 2.5], resolveAt: 0.3, becomes: WALL },
  // Somewhere to wait.
  { position: [BENCH.x, BENCH.height / 2, BENCH.z], size: [BENCH.width, BENCH.height, BENCH.depth], resolveAt: 0.55, becomes: BENCH_COLOR },
  // The chapter text, as grey bars until it arrives: kicker, name, three lines.
  ...(
    [
      [0, 0.08, 1.5],
      [-0.22, 0.4, 2.3],
      [-0.84, 0.09, 3],
      [-1.03, 0.09, 2.85],
      [-1.22, 0.09, 1.6],
    ] as const
  ).map(([y, h, w]): Placeholder => ({
    position: [TEXT.x, TEXT.top + y - h / 2, TEXT.start + w / 2],
    size: [0.03, h, w],
    resolveAt: 0.8,
    becomes: null,
  })),
]

/** Ceiling slots, still grey: their light is one of the last things to arrive. */
const SLOTS: Placeholder[] = [-18, -21.1, -24.2].map((z, i) => ({
  position: [3, cell.height - 0.004, z],
  size: [0.14, 0.001, 2.2],
  resolveAt: 0.62 + i * 0.12,
  becomes: STATES_COLORS.glow,
}))

const LIT = { base: new THREE.Color('#6a6863'), shine: new THREE.Color('#87847e') }
const UNLIT = { base: new THREE.Color('#3b3a37'), shine: new THREE.Color('#5a5853') }

const shimmer = (now: number, along: number) => Math.pow(0.5 + 0.5 * Math.sin(now * 2.2 + along * 1.1), 3)

function usePlaceholders(items: Placeholder[], material: THREE.Material) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const finals = useMemo(() => items.map((item) => (item.becomes ? new THREE.Color(item.becomes) : null)), [items])
  const resolvedAt = useRef(new Float32Array(items.length).fill(Infinity))
  const scratch = useMemo(() => ({ object: new THREE.Object3D(), color: new THREE.Color() }), [])

  const place = (i: number, scale: number) => {
    const { object } = scratch
    object.position.set(...items[i].position)
    object.scale.set(...items[i].size).multiplyScalar(Math.max(1e-4, scale))
    object.updateMatrix()
    mesh.current?.setMatrixAt(i, object.matrix)
  }

  useLayoutEffect(() => {
    items.forEach((_, i) => {
      place(i, 1)
      mesh.current?.setColorAt(i, LIT.base)
    })
    if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true
  }, [])

  /** Shimmers what is still loading and settles what has arrived. */
  const update = (now: number, progress: number, palette: typeof LIT) => {
    const target = mesh.current
    if (!target) return
    let moved = false
    items.forEach((item, i) => {
      if (progress >= item.resolveAt && resolvedAt.current[i] === Infinity) resolvedAt.current[i] = now
      if (progress < item.resolveAt) resolvedAt.current[i] = Infinity
      const settled = smoothstep(0, 0.6, now - resolvedAt.current[i])
      const { color } = scratch
      color.lerpColors(palette.base, palette.shine, shimmer(now, -item.position[2]))
      const final = finals[i]
      if (final) color.lerp(final, settled)
      target.setColorAt(i, color)
      if (!final) {
        place(i, 1 - settled)
        moved = true
      }
    })
    if (target.instanceColor) target.instanceColor.needsUpdate = true
    if (moved) target.instanceMatrix.needsUpdate = true
  }

  return { mesh, element: <instancedMesh ref={mesh} args={[UNIT_BOX, material, items.length]} frustumCulled={false} />, update }
}

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)
const SOLID_MATERIAL = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.94 })
const SLOT_MATERIAL = new THREE.MeshBasicMaterial({ color: '#ffffff' })
const BARRIER_MATERIAL = new THREE.MeshStandardMaterial({ color: LIT.base, roughness: 0.94 })

/**
 * I — LOADING. The room has not finished loading when the visitor arrives. Parts of
 * its walls, its bench, its light and its text are placeholders, shimmering in the
 * familiar way. Arriving starts the load; the room assembles itself around the visitor,
 * stalls at 93%, then at 99%, and only then lets them through. The way on is visible
 * the whole time, over a waist-high placeholder in the doorway.
 *
 * Reset: like a page, it loads again on every visit. Once the visitor has left Room 03
 * altogether (it is no longer visible), the room unloads; walking back into LOADING
 * from EMPTY within one visit finds it loaded, so the barrier can never be met from behind.
 */
export function LoadingState() {
  const { id: roomId, origin } = useRoom()
  const clock = useThree((state) => state.clock)
  const activity = useActivity()
  const startedAt = useRef<number | null>(null)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const play = useSound()
  const sunk = useRef(0)
  const barrier = useRef<THREE.Group>(null)
  const bar = useRef<THREE.Mesh>(null)
  const percent = useRef<FadingText & { text: string; sync: () => void }>(null)
  const shown = useRef(-1)
  const texts = useRef<(FadingText | null)[]>([])
  const solids = usePlaceholders(SOLIDS, SOLID_MATERIAL)
  const slots = usePlaceholders(SLOTS, SLOT_MATERIAL)
  const exit = localDoor(DOORS.loadingExit, origin)

  useEffect(() => {
    if (activity !== 'inactive') return
    startedAt.current = null
    sunk.current = 0
    setOpen(false)
    setLoading(false)
  }, [activity])

  useRoomFrame((_, delta) => {
    const now = clock.elapsedTime
    if (startedAt.current === null && stateZoneNow(roomId) === 'loading') {
      startedAt.current = now
      setLoading(true)
    }
    const progress = startedAt.current === null ? 0 : progressAt(now - startedAt.current)

    solids.update(now, progress, LIT)
    slots.update(now, progress, UNLIT)
    BARRIER_MATERIAL.color.lerpColors(LIT.base, LIT.shine, shimmer(now, -DOOR_Z))

    const read = smoothstep(0.8, 0.9, progress)
    texts.current.forEach((text) => {
      if (text) text.fillOpacity = read
    })

    const value = Math.floor(progress * 100)
    if (percent.current && value !== shown.current) {
      shown.current = value
      percent.current.text = `Loading ${value}%`
      percent.current.sync()
    }
    if (bar.current) {
      bar.current.scale.x = Math.max(0.001, progress)
      bar.current.position.x = -BARRIER.width / 2 + 0.08 + ((BARRIER.width - 0.16) * progress) / 2
    }

    if (progress >= 1 && !open) {
      setOpen(true)
      setLoading(false)
      play('loading-done', [exit.center, 1.4, DOOR_Z])
      play('barrier-sink', [exit.center, 0.5, DOOR_Z])
    }
    sunk.current = THREE.MathUtils.damp(sunk.current, progress >= 1 ? 1 : 0, 3, delta)
    if (barrier.current) {
      barrier.current.position.y = -(BARRIER.height + 0.05) * sunk.current
      barrier.current.visible = sunk.current < 0.995
    }
  })

  // While it loads, the doorway quietly processes; the sound stops the moment it is done.
  useSoundLoop('loading', [exit.center, 1, DOOR_Z], 0.5, loading)

  useObstacle('loading-barrier', open ? null : rect(exit.center - exit.width / 2, exit.center + exit.width / 2, DOOR_Z - 0.12, DOOR_Z + 0.12))
  useObstacle('loading-bench', box(BENCH.x, BENCH.z, BENCH.width, BENCH.depth))
  useFocusTarget({ id: 'loading', position: [exit.center, 1, DOOR_Z + 0.2], distance: 3.6, facing: 0.6, card: open ? null : CARDS.loading, labelled: true })

  const face = BARRIER.depth / 2 + 0.003

  return (
    <>
      {solids.element}
      {slots.element}

      <ChapterMark position={[TEXT.x, TEXT.top, TEXT.start]} facing="west" room="03" chapter={CHAPTERS.loading} texts={texts} />

      {/* The way on: open above, held shut below by a placeholder with a progress bar. */}
      <group ref={barrier} position={[exit.center, 0, DOOR_Z]}>
        <mesh position={[0, BARRIER.height / 2, 0]} material={BARRIER_MATERIAL}>
          <boxGeometry args={[BARRIER.width, BARRIER.height, BARRIER.depth]} />
        </mesh>
        <mesh position={[0, BARRIER.height - 0.09, face]} material={basicMaterial('#2c2b29')}>
          <planeGeometry args={[BARRIER.width - 0.16, 0.012]} />
        </mesh>
        <mesh ref={bar} position={[0, BARRIER.height - 0.09, face + 0.001]} scale={[0.001, 1, 1]} material={basicMaterial(INK.text)}>
          <planeGeometry args={[BARRIER.width - 0.16, 0.012]} />
        </mesh>
        <Text ref={percent} position={[-BARRIER.width / 2 + 0.08, BARRIER.height - 0.16, face]} fontSize={0.07} letterSpacing={0.06} color={INK.dark} anchorX="left" anchorY="top">
          Loading 0%
        </Text>
      </group>

      {/* EMPTY is lighter than this room; its light reaches through the doorway. */}
      <LightPool position={[exit.center, 0.004, DOOR_Z + 1.1]} size={[3.4, 2.2]} color="#dcd8cf" strength={0.1} />
    </>
  )
}
