import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { Cradle, CRADLE_SEAT } from '../../../components/Cradle'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { Plinth } from '../../../components/Plinth'
import { Text } from '../../../components/Text'
import { facingRotation } from '../../../components/WallText'
import { INK_ON_LIGHT } from '../../../identity'
import { useRoomFrame } from '../../../museum/RoomContext'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { CIRCLE, roundedRect } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { OAK_MATERIAL } from '../../../scene/materials'
import { CARDS, LAYOUT } from '../content'
import { SCREEN, since } from './shared'

const PLINTH = { width: 1.4, height: 1.05, depth: 0.7 }
const ICON = 0.42
const GRID = { columns: 6, rows: 4, size: 0.56, bottom: 1.15, pitch: 0.8 }
const COLOURS = ['#3d7be0', '#e0a23d', '#4bb06a', '#8a5cd6', '#d65c8a', '#2fa6b8', '#e06a3d', '#5c6fd6'].map((c) => new THREE.Color(c))
/** After "mark all as read", a moment of quiet; then the counts come back one by one. */
const QUIET = 3
const EACH = 0.35

const count = (i: number) => {
  const value = Math.round(1 + Math.pow(i + 1, 1.9) / 3)
  return value > 99 ? '99+' : String(value)
}

/**
 * Exhibit 03. One app icon on a plinth with its red badge, and behind it, on the hall's
 * north wall, a wall of icons, every one with a number. Marking them all as read clears
 * the wall; after a moment of quiet the numbers come back, one at a time.
 */
export function Badges() {
  const [x, z] = LAYOUT.badge
  const clock = useThree((state) => state.clock)
  const clearedAt = useRef(-Infinity)
  const [shown, setShown] = useState(GRID.columns * GRID.rows)
  const play = useSound()
  const total = GRID.columns * GRID.rows

  useObstacle('badge', box(x, z, PLINTH.width, PLINTH.depth))
  const clear = useCallback(() => {
    clearedAt.current = clock.elapsedTime
    setShown(0)
    play('badges-clear', [x, 1.4, z])
  }, [clock, play, x, z])
  useFocusTarget({ id: 'badge', position: [x, 1.3, z + 0.2], card: CARDS.badge, labelled: true, prompt: shown > 0 ? 'MARK ALL AS READ' : null, onInteract: clear })

  useRoomFrame(({ clock }) => {
    const t = since(clearedAt.current, clock.elapsedTime) - QUIET
    const now = t < 0 ? 0 : Math.min(total, Math.floor(t / EACH) + 1)
    if (now !== shown && Number.isFinite(clearedAt.current)) {
      if (now > shown) play('badge', [x, 2.4, LAYOUT.badgeWall.z])
      setShown(now)
    }
  })

  return (
    <>
      <group position={[x, 0, z]}>
        <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} material={OAK_MATERIAL} />
        <group position={[0, PLINTH.height, 0]}>
          <Cradle width={ICON + 0.12} />
          <group position={[0, 0.06 - CRADLE_SEAT + ICON / 2, 0]}>
            <Icon colour="#3d7be0" size={ICON} badge={shown > 0 ? '1' : null} />
          </group>
        </group>
        <ExhibitLabel position={[-PLINTH.width / 2 + 0.12, PLINTH.height - 0.1, PLINTH.depth / 2 + 0.004]} exhibit={CARDS.badge} width={PLINTH.width - 0.24} ink={INK_ON_LIGHT} />
      </group>
      <BadgeWall shown={shown} />
    </>
  )
}

/** An app icon, front at +z: a rounded tile, a white mark, and its badge. */
function Icon({ colour, size, badge }: { colour: string; size: number; badge: string | null }) {
  return (
    <group>
      <mesh geometry={roundedRect(size, size, size * 0.22)}>
        <meshBasicMaterial color={colour} />
      </mesh>
      <mesh geometry={CIRCLE} position={[0, 0, 0.002]} scale={size * 0.22} material={SCREEN.paper} />
      {badge && (
        <group position={[size / 2 - 0.02, size / 2 - 0.02, 0.004]}>
          <mesh geometry={CIRCLE} scale={size * 0.2} material={SCREEN.redFill} />
          <Text position={[0, 0, 0.002]} fontSize={size * 0.2} color="#ffffff" anchorX="center" anchorY="middle">
            {badge}
          </Text>
        </group>
      )}
    </group>
  )
}

/** The wall of icons: tiles and marks instanced; the badges and their numbers, as many as are shown. */
function BadgeWall({ shown }: { shown: number }) {
  const { from, to, z } = LAYOUT.badgeWall
  const tiles = useRef<THREE.InstancedMesh>(null)
  const marks = useRef<THREE.InstancedMesh>(null)
  const cells = useMemo(() => {
    const step = (to - from) / GRID.columns
    return Array.from({ length: GRID.columns * GRID.rows }, (_, i) => {
      const column = i % GRID.columns
      const row = Math.floor(i / GRID.columns)
      return { x: from + step * (column + 0.5), y: GRID.bottom + row * GRID.pitch, colour: COLOURS[(i * 5) % COLOURS.length] }
    })
  }, [from, to])
  // Badges appear in a scattered order, not left to right.
  const order = useMemo(() => cells.map((_, i) => i).sort((a, b) => ((a * 7919) % 31) - ((b * 7919) % 31)), [cells])
  const tile = useMemo(() => {
    const g = roundedRect(GRID.size, GRID.size, GRID.size * 0.22).clone()
    return g
  }, [])

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    cells.forEach((cell, i) => {
      m.makeTranslation(cell.x, cell.y, z + 0.02)
      tiles.current?.setMatrixAt(i, m)
      tiles.current?.setColorAt(i, cell.colour)
      m.makeScale(GRID.size * 0.22, GRID.size * 0.22, 1).setPosition(cell.x, cell.y, z + 0.022)
      marks.current?.setMatrixAt(i, m)
    })
    if (tiles.current) {
      tiles.current.instanceMatrix.needsUpdate = true
      if (tiles.current.instanceColor) tiles.current.instanceColor.needsUpdate = true
    }
    if (marks.current) marks.current.instanceMatrix.needsUpdate = true
  }, [cells, z])

  return (
    <>
      <instancedMesh ref={tiles} args={[tile, undefined, cells.length]} frustumCulled={false}>
        <meshBasicMaterial />
      </instancedMesh>
      <instancedMesh ref={marks} args={[CIRCLE, SCREEN.paper, cells.length]} frustumCulled={false} />
      {order.slice(0, shown).map((i) => {
        const cell = cells[i]
        return (
          <group key={i} position={[cell.x + GRID.size / 2 - 0.03, cell.y + GRID.size / 2 - 0.03, z + 0.026]} rotation={facingRotation('south')}>
            <mesh geometry={CIRCLE} scale={0.12} material={SCREEN.redFill} />
            <Text position={[0, 0, 0.002]} fontSize={0.1} color="#ffffff" anchorX="center" anchorY="middle">
              {count(i)}
            </Text>
          </group>
        )
      })}
    </>
  )
}
