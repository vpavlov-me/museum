import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { ChapterMark } from '../../../components/ChapterMark'
import { Text } from '../../../components/Text'
import { Wall } from '../../../components/Wall'
import { DOORS, localDoor, WALL_THICKNESS } from '../../../museum/roomRegistry'
import { useRoom, useRoomFrame } from '../../../museum/RoomContext'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { roundedRect } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight, LightPool, Luminaire } from '../../../scene/Light'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { CARDS, CELLS, CHAPTERS, ERROR_STATUS, INK } from '../content'

const cell = CELLS.error
const palette = PALETTES.states
const t = WALL_THICKNESS
const COOL = '#dfe6e8'
const RETRY_MS = 1100

type Stage = 'broken' | 'retrying' | 'still' | 'resolved'
/** The room's configuration: wrong, differently wrong after one retry, right after two. */
type Layout = 'broken' | 'still' | 'resolved'

/** The regular rhythm the room was designed with: pilasters and ceiling slots on these lines. */
const RHYTHM = [-51, -53.4, -55.8, -58.2, -60.6]
/** A wall-height gap in the east wall: where the slab plugging the exit belongs. */
const GAP = { z0: -58.2, z1: -55.6, height: 3.2 }
const SLAB = { width: 2.6, height: GAP.height, depth: t }

type Pose = { x: number; y: number; z: number; rotation: number }
const pose = (x: number, z: number, rotation = 0, y = 0): Pose => ({ x, y, z, rotation })

const SLAB_POSES: Record<Layout, Pose> = {
  // Pulled out of the east wall and dropped across the exit, slightly askew.
  broken: pose(0.55, cell.minZ + 0.32, 0.07),
  still: pose(0.35, cell.minZ + 0.3, -0.06),
  // Home: flush in the east wall, closing the gap.
  resolved: pose(cell.maxX + t / 2, (GAP.z0 + GAP.z1) / 2, Math.PI / 2),
}

const WEST = cell.minX + 0.1
const EAST = cell.maxX - 0.1
/** Pilaster positions per layout. The last one is a duplicate of its neighbour, drawn twice. */
const PILASTERS: Record<Layout, Pose[]> = (() => {
  const base = [...RHYTHM.map((z) => pose(WEST, z)), pose(EAST, RHYTHM[0]), pose(EAST, RHYTHM[1]), pose(EAST, RHYTHM[4])]
  const broken = base.map((p) => ({ ...p }))
  broken[2] = pose(WEST + 0.12, RHYTHM[2] - 0.65)
  const still = base.map((p) => ({ ...p }))
  still[4] = pose(WEST + 0.06, RHYTHM[4] + 0.6)
  still[5] = pose(EAST, RHYTHM[0], 0, 0.32)
  return {
    broken: [...broken, pose(EAST - 0.05, RHYTHM[1] + 0.24)],
    still: [...still, pose(EAST - 0.05, RHYTHM[1] + 0.24)],
    resolved: [...base, pose(EAST, RHYTHM[1])],
  }
})()
const PILASTER = { width: 0.34, depth: 0.2 }

/** The one ceiling slot out of line. */
const STRAY_SLOT: Record<Layout, Pose> = {
  broken: pose(0.5, RHYTHM[2], 0.21),
  still: pose(0.82, RHYTHM[2], -0.12),
  resolved: pose(0.5, RHYTHM[2], 0),
}

const SIGN: Record<Layout, string> = { broken: 'EXIT  →', still: 'EXIT  →', resolved: 'EXIT  ↓' }
const LINE_CLIP: [number, number, number, number] = [-0.1, -0.37, 2.35, 0.1]

const MESSAGE_AT: [number, number, number] = [-4.6, 2.2, cell.minZ + 0.3]

const UNIT_BOX = new THREE.BoxGeometry(1, 1, 1)

/** Frame time for `ease`, set at the top of each frame: one shared function, nothing allocated per frame. */
let frameDelta = 0
const ease = (from: number, to: number, speed = 5) => THREE.MathUtils.damp(from, to, speed, frameDelta)
const SLOT_SIZE: [number, number] = [0.12, 1.5]

/**
 * III — ERROR. The system is still here; its logic is not. Nothing flickers or
 * glitches: the room is simply built wrongly. A wall slab has been pulled out of
 * the east wall and dropped across the exit; the gap it left opens onto nothing.
 * The pilasters lose their rhythm, one is drawn twice, a ceiling slot is turned,
 * the sign points into the gap, the door you came in by has a twin, and the
 * explanation is cut off. RETRY reconfigures the room into a different mistake;
 * a second RETRY puts everything back where it belongs and opens the way.
 *
 * Reset: none. Once resolved, it stays resolved for the rest of the visit, so the
 * room can always be walked backwards. Collision: the slab only blocks while it
 * stands in the doorway, and its obstacle is released the moment it starts moving,
 * so it can never close on the visitor.
 */
export function ErrorState() {
  const { origin } = useRoom()
  const [stage, setStage] = useState<Stage>('broken')
  const [layout, setLayout] = useState<Layout>('broken')
  const attempts = useRef(0)
  const timer = useRef<number | undefined>(undefined)
  const play = useSound()
  const exit = localDoor(DOORS.errorExit, origin)
  const entry = localDoor(DOORS.errorEntry, origin)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const retry = useCallback(() => {
    attempts.current += 1
    const next: Layout = attempts.current >= 2 ? 'resolved' : 'still'
    setStage('retrying')
    play('error-retrying', MESSAGE_AT)
    timer.current = window.setTimeout(() => {
      // A failure felt rather than announced; a fix heard where it happens, as the slab slides home.
      if (next === 'still') play('error-fail', MESSAGE_AT)
      else play('error-resolve', [SLAB_POSES.broken.x, 1.6, SLAB_POSES.broken.z])
      setLayout(next)
      setStage(next)
    }, RETRY_MS)
  }, [play])

  // Everything that moves eases towards the current layout's pose.
  const slab = useRef<THREE.Group>(null)
  const stray = useRef<THREE.Mesh>(null)
  const pilasters = useRef<THREE.InstancedMesh>(null)
  const current = useRef(PILASTERS.broken.map((p) => ({ ...p })))
  const scratch = useMemo(() => new THREE.Object3D(), [])

  const placePilasters = useCallback(() => {
    const mesh = pilasters.current
    if (!mesh) return
    current.current.forEach((p, i) => {
      scratch.position.set(p.x, cell.height / 2 + p.y, p.z)
      scratch.scale.set(PILASTER.depth, cell.height, PILASTER.width)
      scratch.updateMatrix()
      mesh.setMatrixAt(i, scratch.matrix)
    })
    // The duplicate disappears once it has merged back into its original.
    mesh.count = layout === 'resolved' && Math.abs(current.current[8].z - RHYTHM[1]) < 0.01 ? 8 : 9
    mesh.instanceMatrix.needsUpdate = true
  }, [layout, scratch])

  useLayoutEffect(placePilasters, [placePilasters])

  useRoomFrame((_, delta) => {
    frameDelta = delta

    let moving = false
    PILASTERS[layout].forEach((target, i) => {
      const p = current.current[i]
      const before = p.x + p.y + p.z
      p.x = ease(p.x, target.x)
      p.y = ease(p.y, target.y)
      p.z = ease(p.z, target.z)
      if (Math.abs(before - (p.x + p.y + p.z)) > 1e-5) moving = true
    })
    if (moving) placePilasters()

    if (slab.current) {
      const target = SLAB_POSES[layout]
      const speed = layout === 'resolved' ? 2.2 : 6
      slab.current.position.x = ease(slab.current.position.x, target.x, speed)
      slab.current.position.z = ease(slab.current.position.z, target.z, speed)
      slab.current.rotation.y = ease(slab.current.rotation.y, target.rotation, speed)
    }
    if (stray.current) {
      const target = STRAY_SLOT[layout]
      stray.current.position.x = ease(stray.current.position.x, target.x)
      stray.current.rotation.z = ease(stray.current.rotation.z, target.rotation)
    }
  })

  useObstacle('error-slab', layout === 'resolved' ? null : rect(exit.center - 1.5, exit.center + 1.4, cell.minZ, cell.minZ + 0.62))

  const interactive = stage === 'broken' || stage === 'still'
  useFocusTarget({
    id: 'error-retry',
    position: [-4.6, 1.5, cell.minZ + 0.2],
    distance: 3.8,
    card: stage === 'resolved' ? null : CARDS.error,
    labelled: true,
    prompt: interactive ? 'RETRY' : null,
    onInteract: retry,
  })

  const wall = cell.minZ + 0.02
  const resolved = layout === 'resolved'
  const start = SLAB_POSES.broken

  return (
    <>
      <StaticMerge>
        {/* The east wall, missing exactly one slab's worth. Beyond the gap there is nothing. */}
        <Wall axis="z" at={cell.maxX + t / 2} from={cell.minZ - t / 2} to={GAP.z0} height={cell.height} palette={palette} />
        <Wall axis="z" at={cell.maxX + t / 2} from={GAP.z1} to={cell.maxZ} height={cell.height} palette={palette} />
        <mesh position={[cell.maxX + t / 2, (GAP.height + cell.height) / 2, (GAP.z0 + GAP.z1) / 2]} material={palette.wall}>
          <boxGeometry args={[t, cell.height - GAP.height, GAP.z1 - GAP.z0]} />
        </mesh>

        {/* Ceiling slots on the room's rhythm, all but the stray one. */}
        {[-4.5, 0.5].flatMap((x) =>
          RHYTHM.filter((z) => !(x === STRAY_SLOT.resolved.x && z === STRAY_SLOT.resolved.z)).map((z) => (
            <Luminaire key={`${x}:${z}`} position={[x, cell.height - 0.004, z]} size={SLOT_SIZE} palette={palette} />
          )),
        )}
      </StaticMerge>

      <mesh ref={stray} position={[STRAY_SLOT.broken.x, cell.height - 0.004, STRAY_SLOT.broken.z]} rotation={[Math.PI / 2, 0, STRAY_SLOT.broken.rotation]} material={palette.glow}>
        <planeGeometry args={SLOT_SIZE} />
      </mesh>
      {RHYTHM.map((z) => (
        <LightPool key={z} position={[-2, 0.004, z]} size={[8, 1.6]} color={COOL} strength={0.035} />
      ))}

      <instancedMesh ref={pilasters} args={[UNIT_BOX, palette.wall, 9]} frustumCulled={false} />

      {/* The slab: a piece of the east wall, in the wrong place. */}
      <group ref={slab} position={[start.x, 0, start.z]} rotation={[0, start.rotation, 0]}>
        <mesh position={[0, SLAB.height / 2, 0]} material={palette.wall}>
          <boxGeometry args={[SLAB.width, SLAB.height, SLAB.depth]} />
        </mesh>
        <mesh position={[0, 0.045, 0]} material={palette.skirting}>
          <boxGeometry args={[SLAB.width, 0.09, SLAB.depth + 0.024]} />
        </mesh>
      </group>

      {/* A twin of the door you came in by, leading nowhere. */}
      {!resolved && (
        <group position={[entry.center + 3.4, 0, cell.maxZ - 0.012]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, entry.height / 2, 0]} material={PALETTES.passage.floor}>
            <planeGeometry args={[entry.width, entry.height]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (entry.width / 2 - 0.03), entry.height / 2, 0.015]} material={palette.reveal}>
              <boxGeometry args={[0.06, entry.height, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0, entry.height - 0.03, 0.015]} material={palette.reveal}>
            <boxGeometry args={[entry.width, 0.06, 0.03]} />
          </mesh>
        </group>
      )}

      <Text position={[exit.center, 3.62, wall]} fontSize={0.09} letterSpacing={0.16} color={INK.muted} anchorX="center" anchorY="middle">
        {SIGN[layout]}
      </Text>

      <ChapterMark position={[cell.minX + 0.45, 3.78, wall]} facing="south" room="03" chapter={CHAPTERS.error} width={3.4} lineClip={resolved ? undefined : LINE_CLIP} />
      <group position={[cell.minX + 0.45, 0, wall]}>
        <Text position={[0, 1.72, 0]} fontSize={0.085} color={stage === 'still' ? '#e8a598' : INK.body} anchorX="left" anchorY="top">
          {ERROR_STATUS[stage]}
        </Text>
        {!resolved && (
          <group position={[0.3, 1.36, 0]}>
            <mesh geometry={roundedRect(0.6, 0.16, 0.08)} material={basicMaterial(stage === 'retrying' ? '#8f8c85' : INK.text)} />
            <Text position={[0, 0, 0.002]} fontSize={0.055} letterSpacing={0.14} color={INK.dark} anchorX="center" anchorY="middle">
              RETRY
            </Text>
          </group>
        )}
      </group>
      <Downlight at={[-4.6, cell.minZ + 2]} aim={[-4.6, 2.4, cell.minZ]} ceiling={cell.height} palette={palette} angle={0.5} penumbra={0.15} intensity={45} color={COOL} />
    </>
  )
}
