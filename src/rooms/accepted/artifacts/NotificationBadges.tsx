import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { Cradle, CRADLE_SEAT } from '../../../components/Cradle'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { Plinth } from '../../../components/Plinth'
import { Text } from '../../../components/Text'
import { motion } from '../../../museum/capabilities'
import { useRoom, useRoomFrame } from '../../../museum/RoomContext'
import { museumStore } from '../../../museum/store'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight } from '../../../scene/Light'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { CARDS, CELLS } from '../content'
import { CIRCLE, hash, roundedRect, useVisitorAway } from '../shared'

const RED = '#e5483b'
const ROOM = CELLS.attend
const PLINTH = { x: 2.4, z: -24.6, width: 1.1, height: 1, depth: 0.7 }
/** The app icon: a tile, its thickness, and the cradle it stands in. */
const ICON = { size: 0.44, depth: 0.05, cradle: 0.05 }
const COUNT = 42
// After "mark all as read", the room stays quiet for a moment before it starts again.
const QUIET_FOR = 2.5
// Badges spread over this stretch of the chapter as the visitor walks deeper into it.
const SPREAD = { start: ROOM.maxZ - 1.3, length: 9.6 }

type Badge = {
  position: [number, number, number]
  rotation: [number, number, number]
  radius: number
  label: string
  /** Revealed once the visitor has walked past this local z. */
  threshold: number
}

const countLabel = (i: number) => {
  const value = Math.round(1 + Math.pow(i, 1.9) / 4)
  return value > 99 ? '99+' : String(value)
}

// The observation text occupies roughly y 1.0–2.9 on the west wall between these z values.
const TEXT_BAND = { minZ: -28.5, maxZ: -22, minY: 0.95, maxY: 3 }

function layoutBadges(): Badge[] {
  const badges: Badge[] = []
  const cx = (ROOM.minX + ROOM.maxX) / 2
  for (let i = 0; i < COUNT; i++) {
    const progress = i / (COUNT - 1)
    const z = THREE.MathUtils.clamp(SPREAD.start - progress * SPREAD.length + (hash(i) - 0.5) * 2, ROOM.minZ + 0.6, ROOM.maxZ - 0.4)
    const radius = 0.05 + 0.04 * hash(i + 50) + 0.32 * Math.pow(progress, 1.6)
    const surface = i % 5
    let position: [number, number, number]
    let rotation: [number, number, number]

    if (surface === 0) {
      // West wall: competes with the wall text without covering it.
      const inBand = z > TEXT_BAND.minZ && z < TEXT_BAND.maxZ
      const y = inBand ? (hash(i + 7) > 0.5 ? 3.25 + hash(i + 9) * 0.5 : 0.3 + hash(i + 9) * 0.45) : 0.5 + hash(i + 9) * 3
      position = [ROOM.minX + 0.012, y, z]
      rotation = [0, Math.PI / 2, 0]
    } else if (surface === 1 || surface === 4) {
      position = [ROOM.maxX - 0.012, 0.5 + hash(i + 9) * 3, z]
      rotation = [0, -Math.PI / 2, 0]
    } else if (surface === 2) {
      position = [cx + (hash(i + 3) - 0.5) * 9, ROOM.height - 0.012, z]
      // Facing down, numbers upright for a visitor walking north.
      rotation = [Math.PI / 2, 0, Math.PI]
    } else {
      position = [cx + (hash(i + 3) - 0.5) * 8.4, 0.006, z]
      rotation = [-Math.PI / 2, 0, 0]
    }

    badges.push({ position, rotation, radius, label: countLabel(i), threshold: SPREAD.start - progress * (SPREAD.length - 1) })
  }
  return badges
}

const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

const popScale = (t: number) => (t >= 0.28 ? 1 : easeOutBack(Math.max(0, t) / 0.28))

/*
 * Every badge in the room is one instance of a single quad, drawn in one call.
 * Its disc and number come from a small canvas atlas, one cell per label.
 */
const ATLAS = { cells: 8, cell: 128 }

function badgeAtlas(labels: string[]) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = ATLAS.cells * ATLAS.cell
  const ctx = canvas.getContext('2d')!
  const c = ATLAS.cell
  labels.forEach((label, i) => {
    const x = (i % ATLAS.cells) * c
    const y = Math.floor(i / ATLAS.cells) * c
    ctx.fillStyle = RED
    ctx.beginPath()
    ctx.arc(x + c / 2, y + c / 2, c / 2 - 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const size = label.length > 2 ? 0.36 : label.length > 1 ? 0.47 : 0.58
    ctx.font = `500 ${Math.round(c * size)}px "Helvetica Neue", Arial, sans-serif`
    ctx.fillText(label, x + c / 2, y + c / 2 + c * 0.03)
  })
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function badgeMaterial(texture: THREE.Texture) {
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.02 })
  // Each instance looks up its own cell of the atlas.
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 cell;')
      .replace('#include <uv_vertex>', `#include <uv_vertex>\nvMapUv = (vMapUv + cell) / ${ATLAS.cells.toFixed(1)};`)
  }
  return material
}

const QUAD = new THREE.PlaneGeometry(2, 2)

/**
 * Exhibit 02. One small badge on a plinth, treated with museum seriousness. As the
 * visitor walks on, the count climbs and badges spread across walls, ceiling and floor:
 * nothing to press, only to approach. "Mark all as read" clears them; a moment later
 * they start coming back.
 */
export function NotificationBadges() {
  const { id: roomId, origin } = useRoom()
  const clock = useThree((state) => state.clock)
  const badges = useMemo(layoutBadges, [])

  const { geometry, material, texture } = useMemo(() => {
    const labels = [...new Set(badges.map((badge) => badge.label))]
    const texture = badgeAtlas(labels)
    const geometry = QUAD.clone()
    const cells = new Float32Array(COUNT * 2)
    badges.forEach((badge, i) => {
      const index = labels.indexOf(badge.label)
      // Canvas rows run top-down, texture rows bottom-up.
      cells.set([index % ATLAS.cells, ATLAS.cells - 1 - Math.floor(index / ATLAS.cells)], i * 2)
    })
    geometry.setAttribute('cell', new THREE.InstancedBufferAttribute(cells, 2))
    return { geometry, material: badgeMaterial(texture), texture }
  }, [badges])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      texture.dispose()
    },
    [geometry, material, texture],
  )

  const instances = useRef<THREE.InstancedMesh>(null)
  const first = useRef<THREE.Group>(null)
  const shownAt = useRef(new Float32Array(COUNT).fill(-1))
  const scales = useRef(new Float32Array(COUNT))
  const deepest = useRef(Infinity)
  const clearedAt = useRef(-Infinity)
  const [count, setCount] = useState(1)
  const play = useSound()
  const tickedAt = useRef(-Infinity)
  const placements = useMemo(
    () =>
      badges.map((badge) => {
        const object = new THREE.Object3D()
        object.position.set(...badge.position)
        object.rotation.set(...badge.rotation)
        return object
      }),
    [badges],
  )

  useObstacle('badge-plinth', box(PLINTH.x, PLINTH.z, PLINTH.width, PLINTH.depth))
  useFocusTarget({
    id: 'notification-badge',
    position: [PLINTH.x, 1.2, PLINTH.z],
    distance: 3.4,
    card: CARDS.badge,
    labelled: true,
    prompt: 'MARK ALL AS READ',
    onInteract: () => {
      clearedAt.current = clock.elapsedTime
      play('badges-clear', [PLINTH.x, 1.3, PLINTH.z])
    },
  })

  useRoomFrame(({ camera }, delta) => {
    const now = clock.elapsedTime
    if (museumStore.get().spaceId === roomId) deepest.current = Math.min(deepest.current, camera.position.z - origin[1])
    else deepest.current = Infinity

    const mesh = instances.current
    let visible = 0
    for (let i = 0; i < COUNT; i++) {
      const show = deepest.current < badges[i].threshold && now > clearedAt.current + QUIET_FOR + i * 0.12
      if (show && shownAt.current[i] < 0) {
        shownAt.current[i] = now
        // The faintest tick as a badge appears, never more than a few a second.
        if (now - tickedAt.current > 0.25) {
          tickedAt.current = now
          play('badge', badges[i].position)
        }
      }
      if (!show) shownAt.current[i] = -1

      const before = scales.current[i]
      scales.current[i] = show ? (motion.reduced ? 1 : popScale(now - shownAt.current[i])) : THREE.MathUtils.damp(before, 0, 16, delta)
      if (mesh && scales.current[i] !== before) {
        const placement = placements[i]
        placement.scale.setScalar(Math.max(1e-4, scales.current[i] * badges[i].radius))
        placement.updateMatrix()
        mesh.setMatrixAt(i, placement.matrix)
        mesh.instanceMatrix.needsUpdate = true
      }
      if (show) visible++
    }

    const quiet = now < clearedAt.current + QUIET_FOR
    if (first.current) first.current.visible = !quiet
    const next = quiet ? 0 : visible + 1
    if (next !== count) setCount(next)
  })

  // Start with every badge collapsed, and collapse them again once the visitor has left
  // the room: the room is not animated while out of sight, so it resets here instead.
  const away = useVisitorAway()
  useLayoutEffect(() => {
    const mesh = instances.current
    if (!mesh) return
    deepest.current = Infinity
    shownAt.current.fill(-1)
    scales.current.fill(0)
    placements.forEach((placement, i) => {
      placement.scale.setScalar(1e-4)
      placement.updateMatrix()
      mesh.setMatrixAt(i, placement.matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [placements, away])

  const label = count > 99 ? '99+' : String(Math.max(count, 1))

  return (
    <>
      <group position={[PLINTH.x, 0, PLINTH.z]}>
        <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} />
        {/* An app icon, a tile standing in a cradle, and the first, polite badge. */}
        <group position={[0, PLINTH.height, 0]}>
          <Cradle width={0.56} depth={0.2} height={ICON.cradle} />
        </group>
        <group position={[0, PLINTH.height + ICON.cradle - CRADLE_SEAT + ICON.size / 2, 0]}>
          <mesh geometry={roundedRect(ICON.size, ICON.size, 0.1)} material={PALETTES.accepted.wall} />
          <mesh position={[0, 0, -ICON.depth / 2 - 0.001]} material={PALETTES.accepted.reveal}>
            <boxGeometry args={[ICON.size - 0.06, ICON.size - 0.06, ICON.depth]} />
          </mesh>
          <group ref={first} position={[0.2, 0.2, 0.01]}>
            <mesh geometry={CIRCLE} material={basicMaterial(RED)} scale={0.075} />
            <Text position={[0, 0, 0.003]} fontSize={0.075 * (label.length > 2 ? 0.72 : label.length > 1 ? 0.95 : 1.15)} color="#ffffff" anchorX="center" anchorY="middle">
              {label}
            </Text>
          </group>
        </group>
        <ExhibitLabel position={[-PLINTH.width / 2 + 0.08, PLINTH.height - 0.07, PLINTH.depth / 2 + 0.004]} exhibit={CARDS.badge} width={0.94} />
      </group>
      {/* Hard and narrow: one object, one pool, before the room fills up. */}
      <Downlight at={[PLINTH.x, PLINTH.z + 1.4]} aim={[PLINTH.x, 1.1, PLINTH.z]} ceiling={ROOM.height} palette={PALETTES.accepted} angle={0.3} penumbra={0.2} intensity={45} />

      <instancedMesh ref={instances} args={[geometry, material, COUNT]} frustumCulled={false} />
    </>
  )
}
