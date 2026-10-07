import { useCallback, useEffect, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useSound } from '../../../audio/useSound'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { Text } from '../../../components/Text'
import { Wall } from '../../../components/Wall'
import { INK, TYPE } from '../../../identity'
import { useRoomFrame } from '../../../museum/RoomContext'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { CIRCLE } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { PALETTES } from '../../../scene/materials'
import { CAPTCHA_Z, CARDS, CELLS } from '../content'
import { smoothstep, useVisitorAway } from '../shared'

const WALL_DEPTH = 0.3
const GATE = { width: 2.7, height: 2.95 }
const TILE = { width: 0.86, height: 0.88, gap: 0.04 }
const CHECK_MS = 1500
const RISE = 3.4

type Stage = 'idle' | 'checking' | 'retry' | 'open'

const HEADLINES: Record<Stage, string> = {
  idle: 'Select all squares with crossings',
  checking: 'Verifying…',
  retry: 'Please try again.',
  open: 'Verified. Thank you for your patience.',
}

const BACKGROUNDS = ['#5d5a52', '#4a4f53', '#6b6556', '#3f4441', '#575049', '#4d4a45']

type Pattern = 'crossing' | 'disc' | 'blocks' | 'horizon'
const PATTERNS: Pattern[] = ['crossing', 'disc', 'blocks', 'horizon']

const PLANE = new THREE.PlaneGeometry(1, 1)
const TILE_MATERIAL = new THREE.MeshBasicMaterial({ vertexColors: true })

/** One coloured piece of a tile image: a unit shape, scaled, placed and painted with vertex colours. */
function piece(shape: THREE.BufferGeometry, color: string, [x, y]: [number, number], [sx, sy]: [number, number], rotation = 0, layer = 0) {
  const geometry = shape.clone().scale(sx, sy, 1).rotateZ(rotation).translate(x, y, layer * 0.002)
  const c = new THREE.Color(color)
  const colors = new Float32Array(geometry.attributes.position.count * 3)
  for (let i = 0; i < colors.length; i += 3) colors.set([c.r, c.g, c.b], i)
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  return geometry
}

const tileImages = new Map<string, THREE.BufferGeometry>()

/** Abstract "photographs": enough to read as an image grid, with no recognisable source. One draw call each. */
function tileImage(pattern: Pattern, color: string) {
  const key = `${pattern}:${color}`
  const cached = tileImages.get(key)
  if (cached) return cached
  const { width: w, height: h } = TILE
  const parts = [piece(PLANE, color, [0, 0], [w, h])]
  if (pattern === 'crossing') [-0.3, -0.15, 0, 0.15, 0.3].forEach((x) => parts.push(piece(PLANE, '#d9d6cc', [x, -0.12], [0.07, 0.5], 0.18, 1)))
  if (pattern === 'disc') parts.push(piece(CIRCLE, '#c9b98f', [0.12, 0.14], [0.16, 0.16], 0, 1))
  if (pattern === 'blocks') {
    parts.push(piece(PLANE, '#2c2e2f', [-0.2, -0.12], [0.24, 0.62], 0, 1))
    parts.push(piece(PLANE, '#363634', [0.14, -0.2], [0.3, 0.46], 0, 1))
  }
  if (pattern === 'horizon') parts.push(piece(PLANE, '#2f302d', [0, -0.22], [w, 0.42], 0, 1))
  const geometry = mergeGeometries(parts, false)
  parts.forEach((part) => part.dispose())
  tileImages.set(key, geometry)
  return geometry
}

const TILES = Array.from({ length: 9 }, (_, i) => {
  const col = i % 3
  const row = Math.floor(i / 3)
  return {
    x: (col - 1) * (TILE.width + TILE.gap),
    y: 0.11 + TILE.height / 2 + row * (TILE.height + TILE.gap),
    front: { pattern: PATTERNS[(i * 5 + 1) % 4], color: BACKGROUNDS[(i * 7) % 6] },
    back: { pattern: PATTERNS[(i * 3 + 2) % 4], color: BACKGROUNDS[(i * 5 + 3) % 6] },
  }
})

/**
 * Exhibit 04. A checkpoint in a partition wall. The gate is a grid of image tiles;
 * pressing E "verifies". The first attempt always asks you to try again. The second
 * lets you through. No bypass, no failure state, just the familiar small tax.
 */
export function Captcha() {
  const away = useVisitorAway()
  const clock = useThree((state) => state.clock)
  const [stage, setStage] = useState<Stage>('idle')
  const [passable, setPassable] = useState(false)
  const attempts = useRef(0)
  const flippedAt = useRef(-Infinity)
  const openedAt = useRef(Infinity)
  const timers = useRef<number[]>([])
  const tiles = useRef<(THREE.Group | null)[]>([])
  const play = useSound()

  const clearTimers = () => {
    timers.current.forEach((timer) => window.clearTimeout(timer))
    timers.current = []
  }

  useEffect(() => clearTimers, [])

  useEffect(() => {
    if (!away) return
    clearTimers()
    attempts.current = 0
    flippedAt.current = -Infinity
    openedAt.current = Infinity
    setStage('idle')
    setPassable(false)
  }, [away])

  const verify = useCallback(() => {
    attempts.current += 1
    const passed = attempts.current >= 2
    flippedAt.current = clock.elapsedTime
    setStage('checking')
    const at: [number, number, number] = [0, 2, CAPTCHA_Z]
    play('captcha-check', at)
    timers.current.push(
      window.setTimeout(() => {
        play(passed ? 'captcha-pass' : 'captcha-retry', at)
        setStage(passed ? 'open' : 'retry')
        if (passed) openedAt.current = clock.elapsedTime
      }, CHECK_MS),
    )
    if (passed) timers.current.push(window.setTimeout(() => setPassable(true), CHECK_MS + 700))
  }, [clock, play])

  useRoomFrame(() => {
    const now = clock.elapsedTime
    const flips = attempts.current
    tiles.current.forEach((tile, i) => {
      if (!tile) return
      // Tiles turn one after another while "verifying", revealing a new set of images.
      const p = smoothstep(0, 0.35, now - flippedAt.current - i * 0.09)
      const from = Math.max(0, flips - 1) * Math.PI
      tile.rotation.y = flips === 0 ? 0 : from + Math.PI * p
      // Once verified, the grid lifts into the lintel like a gate.
      const row = Math.floor(i / 3)
      tile.position.y = TILES[i].y + RISE * smoothstep(0, 0.9, now - openedAt.current - row * 0.12 - (i % 3) * 0.05)
    })
  })

  const half = WALL_DEPTH / 2
  useObstacle('captcha-gate', passable ? null : rect(-GATE.width / 2, GATE.width / 2, CAPTCHA_Z - half, CAPTCHA_Z + half))

  const interactive = stage === 'idle' || stage === 'retry'
  useFocusTarget({
    id: 'captcha',
    position: [0, 1.5, CAPTCHA_Z + half],
    distance: 3.4,
    card: stage === 'open' ? null : CARDS.captcha,
    labelled: true,
    prompt: interactive ? 'VERIFY' : null,
    onInteract: verify,
  })

  const face = CAPTCHA_Z + half + 0.01

  return (
    <>
      {/* A partition across the room: the end of chapter II. */}
      <Wall
        axis="x"
        at={CAPTCHA_Z}
        from={CELLS.attend.minX}
        to={CELLS.attend.maxX}
        height={CELLS.attend.height}
        thickness={WALL_DEPTH}
        palette={PALETTES.accepted}
        door={{ center: 0, width: GATE.width, height: GATE.height }}
      />
      <ExhibitLabel position={[CELLS.attend.minX + 0.2, 1.6, face]} exhibit={CARDS.captcha} width={1.15} />

      <Text position={[0, 3.62, face]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="center" anchorY="middle">
        VERIFY THAT YOU ARE HUMAN
      </Text>
      <Text position={[0, 3.32, face]} fontSize={0.17} color={stage === 'retry' ? '#e8a598' : '#efede6'} anchorX="center" anchorY="middle">
        {HEADLINES[stage]}
      </Text>

      {TILES.map((tile, i) => (
        <group
          key={i}
          ref={(node) => {
            tiles.current[i] = node
          }}
          position={[tile.x, tile.y, CAPTCHA_Z]}
        >
          <mesh position={[0, 0, 0.012]} geometry={tileImage(tile.front.pattern, tile.front.color)} material={TILE_MATERIAL} />
          <mesh position={[0, 0, -0.012]} rotation={[0, Math.PI, 0]} geometry={tileImage(tile.back.pattern, tile.back.color)} material={TILE_MATERIAL} />
        </group>
      ))}
    </>
  )
}
