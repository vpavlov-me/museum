import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ambience } from '../../../audio/ambience'
import { useSound } from '../../../audio/useSound'
import { ChapterMark } from '../../../components/ChapterMark'
import { Text } from '../../../components/Text'
import { DOORS, localDoor, WALL_THICKNESS } from '../../../museum/roomRegistry'
import { useRoom, useRoomFrame } from '../../../museum/RoomContext'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { CIRCLE } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { LightPool, Luminaire } from '../../../scene/Light'
import { basicMaterial, createPalette, createPoolMaterial, STATES_COLORS } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { CARDS, CELLS, CHAPTERS, INK } from '../content'
import { smoothstep, stateZoneNow } from '../shared'

const cell = CELLS.offline
const t = WALL_THICKNESS

/**
 * OFFLINE's own palette: the same grey as the rest of Room 03, but these materials
 * are this room's alone, so its light can fail without touching the rooms either side
 * (which is why it builds its own half of both shared walls).
 */
export const OFFLINE_PALETTE = createPalette(STATES_COLORS)

const BASE = {
  wall: OFFLINE_PALETTE.wall.color.clone(),
  floor: OFFLINE_PALETTE.floor.color.clone(),
  ceiling: OFFLINE_PALETTE.ceiling.color.clone(),
  glow: OFFLINE_PALETTE.glow.color.clone(),
}
const POOL_STRENGTH = 0.07
const POOL_COLOR = new THREE.Color('#dfe6e8')
const POOLS = createPoolMaterial('#dfe6e8', POOL_STRENGTH)

/** How much of the room survives a power cut: enough to see the walls, not to read them. */
const DARK = 0.09

let appliedPower = 1

function applyPower(power: number) {
  // Settled (fully on, or fully dark): nothing to recolour this frame.
  if (Math.abs(power - appliedPower) < 1e-4) return
  appliedPower = power
  const k = DARK + (1 - DARK) * power
  OFFLINE_PALETTE.wall.color.copy(BASE.wall).multiplyScalar(k)
  OFFLINE_PALETTE.floor.color.copy(BASE.floor).multiplyScalar(k)
  OFFLINE_PALETTE.ceiling.color.copy(BASE.ceiling).multiplyScalar(k)
  OFFLINE_PALETTE.ceiling.emissive.copy(BASE.ceiling).multiplyScalar(k)
  OFFLINE_PALETTE.glow.color.copy(BASE.glow).multiplyScalar(power * power)
  POOLS.color.copy(POOL_COLOR).multiplyScalar(POOL_STRENGTH * power * power)
}

/* The network line runs along the east wall at waist height, then along the north wall to the exit. */
const LINE = { x: cell.maxX - 0.025, y: 1, size: 0.022 }
const BREAK = { z0: -69.4, z1: -70.6 }
const LIVE = new THREE.Color('#d3dbdb')
const DEAD = new THREE.Color('#2a2928')
const AMBER = new THREE.Color('#e0a050')
const LIVE_LINE = basicMaterial('#d3dbdb')
const ROOM_LINE = new THREE.MeshBasicMaterial({ color: LIVE })
const INDICATOR = new THREE.MeshBasicMaterial({ color: LIVE })
const PULSE = basicMaterial('#ffffff')
// Hanging: the bridge swings down from its pivot.
const DROPPED = -0.9

/* An interface on the west wall: three posts that lose their content when the connection does. */
const PANEL = { z: -70, y: 1.65, width: 3.6, height: 1.9 }
const CARD = { width: 1, height: 1.5, spacing: 1.15 }
type Piece = { x: number; y: number; width: number; height: number; color: string }
const PIECES: Piece[] = [-1, 0, 1].flatMap((column, i) => {
  const x = column * CARD.spacing
  return [
    { x, y: 0.28, width: 0.84, height: 0.62, color: ['#5b6a73', '#7a6a55', '#5f6e5b'][i] },
    { x: x - 0.12, y: -0.17, width: 0.6, height: 0.06, color: '#8f8c85' },
    { x, y: -0.32, width: 0.84, height: 0.04, color: '#5f5d58' },
    { x: x - 0.07, y: -0.42, width: 0.7, height: 0.04, color: '#5f5d58' },
  ]
})
const EMPTY = new THREE.Color('#242422')
const PIECE_COLORS = PIECES.map((piece) => new THREE.Color(piece.color))

const UNIT_PLANE = new THREE.PlaneGeometry(1, 1)
const PIECE_MATERIAL = new THREE.MeshBasicMaterial({ color: '#ffffff' })

/** Emergency guidance: small warm marks on the floor, from the entrance to the exit. They never go out. */
const GUIDE = basicMaterial('#b98d55')
const GUIDE_PATH: [number, number][] = [
  [0.5, -63.9],
  [0.5, -72.4],
  [-2.5, -75.4],
  [-2.5, -76.5],
]
function guideMarks() {
  const marks: [number, number][] = []
  for (let i = 1; i < GUIDE_PATH.length; i++) {
    const [x0, z0] = GUIDE_PATH[i - 1]
    const [x1, z1] = GUIDE_PATH[i]
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 0.75))
    for (let s = i === 1 ? 0 : 1; s <= steps; s++) marks.push([x0 + ((x1 - x0) * s) / steps, z0 + ((z1 - z0) * s) / steps])
  }
  return marks
}

type Phase = 'online' | 'offline' | 'reconnecting' | 'restored'

const OFFLINE_PLACE = 'states:offline'
const NODE_AT: [number, number, number] = [LINE.x, LINE.y, (BREAK.z0 + BREAK.z1) / 2]

/** Seconds into reconnecting: the bridge lifts, a pulse runs back along the line, light follows, the door opens. */
const RECONNECT = { pulse: [0.6, 1.8] as const, light: [1.1, 2.6] as const, door: 2.3, done: 3 }

/**
 * IV — OFFLINE. The room is lit when you look into it. Step inside and the
 * connection goes: a piece of the network line drops out and hangs, the line
 * goes dark from the break back to the entrance, the light fails in two steps and
 * the interface on the wall loses its content. What remains is emergency light:
 * marks on the floor, a sign over a closed door, and the half of the line that is
 * still connected, leading to a node at the break. RECONNECT lifts the line back
 * into place; a pulse runs back along it, the light follows and the door slides open.
 *
 * Reset: none. Once reconnected, the room stays online for the rest of the visit,
 * so walking back through it is just walking through a room. Nothing closes again.
 */
export function OfflineState() {
  const { id: roomId, origin } = useRoom()
  const clock = useThree((state) => state.clock)
  const [phase, setPhase] = useState<Phase>('online')
  const [doorOpen, setDoorOpen] = useState(false)
  const droppedAt = useRef(Infinity)
  const reconnectedAt = useRef(Infinity)
  const power = useRef(1)
  const lineLive = useRef(1)
  const fills = useRef(PIECES.map(() => 1))
  const play = useSound()

  const bridge = useRef<THREE.Group>(null)
  const pulse = useRef<THREE.Mesh>(null)
  const door = useRef<THREE.Mesh>(null)
  const pieces = useRef<THREE.InstancedMesh>(null)
  const scratch = useMemo(() => ({ object: new THREE.Object3D(), color: new THREE.Color() }), [])
  const marks = useMemo(guideMarks, [])
  const guides = useRef<THREE.InstancedMesh>(null)
  const exit = localDoor(DOORS.offlineExit, origin)
  const doorEdge = exit.center + exit.width / 2

  useEffect(
    () => () => {
      appliedPower = Number.NaN
      applyPower(1)
      ambience.setVariant(OFFLINE_PLACE, null)
    },
    [],
  )

  useLayoutEffect(() => {
    const { object } = scratch
    PIECES.forEach((piece, i) => {
      object.position.set(piece.x, piece.y, 0)
      object.scale.set(piece.width, piece.height, 1)
      object.updateMatrix()
      pieces.current?.setMatrixAt(i, object.matrix)
      pieces.current?.setColorAt(i, PIECE_COLORS[i])
    })
    marks.forEach(([x, z], i) => {
      object.position.set(x, 0.003, z)
      object.rotation.set(-Math.PI / 2, 0, 0)
      object.scale.setScalar(0.035)
      object.updateMatrix()
      guides.current?.setMatrixAt(i, object.matrix)
    })
    object.rotation.set(0, 0, 0)
  }, [marks, scratch])

  const reconnect = useCallback(() => {
    reconnectedAt.current = clock.elapsedTime
    setPhase('reconnecting')
    play('reconnect', NODE_AT)
    ambience.setVariant(OFFLINE_PLACE, null)
  }, [clock, play])

  useRoomFrame((_, delta) => {
    const now = clock.elapsedTime
    if (phase === 'online' && stateZoneNow(roomId) === 'offline') {
      droppedAt.current = now
      setPhase('offline')
      // The air handling stops with the connection; only the building's own quiet is left.
      play('power-down', [0.5, 3, -70])
      ambience.setVariant(OFFLINE_PLACE, 'states:offline-dark')
    }

    const sinceDrop = now - droppedAt.current
    const sinceReconnect = now - reconnectedAt.current
    const disconnected = sinceDrop >= 0.3 && sinceReconnect < 0

    // The light fails in two steps, a moment after the line drops; it returns smoothly behind the pulse.
    let target = 1
    if (disconnected) target = sinceDrop < 0.75 ? 0.4 : 0
    if (sinceReconnect >= 0) target = smoothstep(RECONNECT.light[0], RECONNECT.light[1], sinceReconnect)
    power.current = sinceReconnect >= 0 ? target : THREE.MathUtils.damp(power.current, target, 16, delta)
    applyPower(power.current)

    const [p0, p1] = RECONNECT.pulse
    lineLive.current = sinceReconnect >= 0 ? smoothstep(p0, p1, sinceReconnect) : disconnected ? 0 : 1
    ROOM_LINE.color.lerpColors(DEAD, LIVE, lineLive.current)

    if (bridge.current) {
      const hanging = sinceDrop >= 0 && sinceReconnect < 0
      bridge.current.rotation.x = THREE.MathUtils.damp(bridge.current.rotation.x, hanging ? DROPPED : 0, hanging ? 9 : 6, delta)
    }
    if (pulse.current) {
      const k = (sinceReconnect - p0) / (p1 - p0)
      pulse.current.visible = k > 0 && k < 1
      pulse.current.position.z = THREE.MathUtils.lerp(BREAK.z0, cell.maxZ - 0.4, k)
    }

    const blink = 0.5 + 0.5 * Math.sin(now * 3)
    if (sinceReconnect >= 0 || !disconnected) INDICATOR.color.copy(LIVE)
    else INDICATOR.color.lerpColors(DEAD, AMBER, 0.35 + 0.65 * blink)

    // Posts empty out one after another, and fill again once the light is back.
    const mesh = pieces.current
    if (mesh) {
      PIECES.forEach((_, i) => {
        const card = Math.floor(i / 4)
        const empty = sinceReconnect >= 0 ? sinceReconnect < RECONNECT.light[1] + card * 0.25 : sinceDrop > 0.9 + card * 0.4
        fills.current[i] = THREE.MathUtils.damp(fills.current[i], empty ? 0 : 1, 6, delta)
        mesh.setColorAt(i, scratch.color.lerpColors(EMPTY, PIECE_COLORS[i], fills.current[i]))
      })
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }

    if (sinceReconnect >= RECONNECT.door && !doorOpen) setDoorOpen(true)
    if (sinceReconnect >= RECONNECT.done && phase === 'reconnecting') setPhase('restored')
    if (door.current) door.current.position.x = THREE.MathUtils.damp(door.current.position.x, doorOpen ? exit.center - exit.width - 0.15 : exit.center, 2.5, delta)
  })

  useObstacle('offline-door', doorOpen ? null : rect(exit.center - exit.width / 2, exit.center + exit.width / 2, cell.minZ - t, cell.minZ))
  useFocusTarget({
    id: 'offline-node',
    position: [LINE.x - 0.2, LINE.y, (BREAK.z0 + BREAK.z1) / 2],
    distance: 3.2,
    card: phase === 'offline' ? CARDS.offline : null,
    labelled: true,
    prompt: phase === 'offline' ? 'RECONNECT' : null,
    onInteract: reconnect,
  })

  const online = phase !== 'offline'
  // Seen from ERROR before anyone enters, the title is a forecast; it changes once the line is restored.
  const restored = phase === 'reconnecting' || phase === 'restored'
  const northFace = cell.minZ + 0.025
  const segment = (from: number, to: number) => Math.abs(to - from)

  return (
    <>
      <StaticMerge>
        {[-66.2, -70.1, -74].map((z) => (
          <Luminaire key={z} position={[0.5, cell.height - 0.004, z]} size={[0.14, 2.6]} palette={OFFLINE_PALETTE} />
        ))}
        {/* The connected half of the line: from the break to the exit, along two walls. */}
        <mesh position={[LINE.x, LINE.y, (BREAK.z1 + northFace) / 2]} material={LIVE_LINE}>
          <boxGeometry args={[LINE.size, LINE.size, segment(BREAK.z1, northFace)]} />
        </mesh>
        <mesh position={[(LINE.x + doorEdge + 0.12) / 2, LINE.y, northFace]} material={LIVE_LINE}>
          <boxGeometry args={[segment(LINE.x, doorEdge + 0.12), LINE.size, LINE.size]} />
        </mesh>
        {/* The connection node at the break. */}
        <mesh position={[cell.maxX - 0.035, LINE.y, BREAK.z1 - 0.06]} material={OFFLINE_PALETTE.reveal}>
          <boxGeometry args={[0.07, 0.22, 0.13]} />
        </mesh>
        {/* The interface on the west wall: a screen and three empty post frames. */}
        <group position={[cell.minX + 0.02, PANEL.y, PANEL.z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={basicMaterial('#161615')}>
            <planeGeometry args={[PANEL.width, PANEL.height]} />
          </mesh>
          {[-1, 0, 1].map((column) => (
            <mesh key={column} position={[column * CARD.spacing, 0, 0.002]} material={basicMaterial('#242422')}>
              <planeGeometry args={[CARD.width, CARD.height]} />
            </mesh>
          ))}
        </group>
        {/* Emergency exit light over the door: on its own circuit. */}
        <mesh position={[exit.center, exit.height + 0.22, cell.minZ + 0.012]} material={GUIDE}>
          <planeGeometry args={[0.7, 0.05]} />
        </mesh>
      </StaticMerge>

      {[-66.2, -70.1, -74].map((z) => (
        <LightPool key={z} position={[0.5, 0.004, z]} size={[3.2, 4]} material={POOLS} />
      ))}
      <LightPool position={[exit.center, 0.004, cell.minZ + 0.8]} size={[2.2, 1.4]} color="#b98d55" strength={0.05} />
      <instancedMesh ref={guides} args={[CIRCLE, GUIDE, marks.length]} frustumCulled={false} />

      {/* The room's half of the line, with the bridge that drops out of it. */}
      <mesh position={[LINE.x, LINE.y, (BREAK.z0 + cell.maxZ - 0.3) / 2]} material={ROOM_LINE}>
        <boxGeometry args={[LINE.size, LINE.size, segment(BREAK.z0, cell.maxZ - 0.3)]} />
      </mesh>
      <group ref={bridge} position={[LINE.x, LINE.y, BREAK.z0]}>
        <mesh position={[0, 0, (BREAK.z1 - BREAK.z0) / 2]} material={ROOM_LINE}>
          <boxGeometry args={[LINE.size, LINE.size, segment(BREAK.z0, BREAK.z1)]} />
        </mesh>
      </group>
      <mesh ref={pulse} position={[LINE.x - 0.004, LINE.y, BREAK.z0]} visible={false} material={PULSE}>
        <boxGeometry args={[LINE.size * 1.6, LINE.size * 1.6, 0.3]} />
      </mesh>
      <mesh position={[cell.maxX - 0.072, LINE.y + 0.05, BREAK.z1 - 0.06]} rotation={[0, -Math.PI / 2, 0]} geometry={CIRCLE} scale={0.022} material={INDICATOR} />
      <Text
        position={[cell.maxX - 0.02, LINE.y + 0.24, BREAK.z1 - 0.06]}
        rotation={[0, -Math.PI / 2, 0]}
        fontSize={0.045}
        letterSpacing={0.16}
        color={online ? INK.muted : '#d9a35a'}
        anchorX="center"
        anchorY="bottom"
      >
        {online ? 'CONNECTED' : 'NO CONNECTION'}
      </Text>

      <group position={[cell.minX + 0.022, PANEL.y, PANEL.z]} rotation={[0, Math.PI / 2, 0]}>
        <instancedMesh ref={pieces} args={[UNIT_PLANE, PIECE_MATERIAL, PIECES.length]} position={[0, 0, 0.003]} frustumCulled={false} />
      </group>

      <ChapterMark position={[-0.9, 3.38, cell.minZ + 0.02]} facing="south" room="03" chapter={restored ? CHAPTERS.online : CHAPTERS.offline} width={3.6} />

      {/* The way on, closed until the connection is back. It slides into the wall. */}
      <mesh ref={door} position={[exit.center, exit.height / 2, cell.minZ - t / 2]} material={OFFLINE_PALETTE.wall}>
        <boxGeometry args={[exit.width, exit.height, 0.05]} />
      </mesh>
    </>
  )
}
