import { useCallback, useEffect, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { Doorway } from '../../../components/Doorway'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { CAPTCHA_Z, CARDS, HALL } from '../content'
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

/** Abstract "photographs": enough to read as an image grid, with no recognisable source. */
function TileImage({ pattern, color }: { pattern: Pattern; color: string }) {
  const { width: w, height: h } = TILE
  return (
    <group>
      <mesh>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {pattern === 'crossing' &&
        [-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
          <mesh key={x} position={[x, -0.12, 0.002]} rotation={[0, 0, 0.18]}>
            <planeGeometry args={[0.07, 0.5]} />
            <meshBasicMaterial color="#d9d6cc" />
          </mesh>
        ))}
      {pattern === 'disc' && (
        <mesh position={[0.12, 0.14, 0.002]}>
          <circleGeometry args={[0.16, 32]} />
          <meshBasicMaterial color="#c9b98f" />
        </mesh>
      )}
      {pattern === 'blocks' && (
        <>
          <mesh position={[-0.2, -0.12, 0.002]}>
            <planeGeometry args={[0.24, 0.62]} />
            <meshBasicMaterial color="#2c2e2f" />
          </mesh>
          <mesh position={[0.14, -0.2, 0.002]}>
            <planeGeometry args={[0.3, 0.46]} />
            <meshBasicMaterial color="#363634" />
          </mesh>
        </>
      )}
      {pattern === 'horizon' && (
        <mesh position={[0, -0.22, 0.002]}>
          <planeGeometry args={[w, 0.42]} />
          <meshBasicMaterial color="#2f302d" />
        </mesh>
      )}
    </group>
  )
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
    timers.current.push(
      window.setTimeout(() => {
        setStage(passed ? 'open' : 'retry')
        if (passed) openedAt.current = clock.elapsedTime
      }, CHECK_MS),
    )
    if (passed) timers.current.push(window.setTimeout(() => setPassable(true), CHECK_MS + 700))
  }, [clock])

  useFrame(() => {
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
  useObstacle('captcha-wall-west', rect(HALL.minX, -GATE.width / 2, CAPTCHA_Z - half, CAPTCHA_Z + half))
  useObstacle('captcha-wall-east', rect(GATE.width / 2, HALL.maxX, CAPTCHA_Z - half, CAPTCHA_Z + half))
  useObstacle('captcha-gate', passable ? null : rect(-GATE.width / 2, GATE.width / 2, CAPTCHA_Z - half, CAPTCHA_Z + half))

  const interactive = stage === 'idle' || stage === 'retry'
  useFocusTarget({
    id: 'captcha',
    position: [0, 1.5, CAPTCHA_Z + half],
    distance: 3.4,
    card: stage === 'open' ? null : CARDS.captcha,
    prompt: interactive ? 'VERIFY' : null,
    onInteract: verify,
  })

  const face = CAPTCHA_Z + half + 0.01

  return (
    <>
      <Doorway
        from={HALL.minX}
        to={HALL.maxX}
        z={CAPTCHA_Z}
        height={HALL.height}
        thickness={WALL_DEPTH}
        color="#353432"
        door={{ center: 0, width: GATE.width, height: GATE.height }}
      />

      <Text position={[0, 3.62, face]} fontSize={0.075} letterSpacing={0.16} color="#8f8c85" anchorX="center" anchorY="middle">
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
          <group position={[0, 0, 0.012]}>
            <TileImage pattern={tile.front.pattern} color={tile.front.color} />
          </group>
          <group position={[0, 0, -0.012]} rotation={[0, Math.PI, 0]}>
            <TileImage pattern={tile.back.pattern} color={tile.back.color} />
          </group>
        </group>
      ))}
    </>
  )
}
