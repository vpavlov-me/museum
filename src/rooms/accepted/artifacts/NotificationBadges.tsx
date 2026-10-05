import { useMemo, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { Plinth } from '../../../components/Plinth'
import { useRoom } from '../../../museum/RoomContext'
import { museumStore } from '../../../museum/store'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { CARDS, HALL } from '../content'
import { CIRCLE, hash, roundedRect } from '../shared'

const RED = '#e5483b'
const PLINTH = { x: 0, z: 4.6, width: 1.1, height: 1, depth: 0.7 }
const COUNT = 42
// After "mark all as read", the room stays quiet for a moment before it starts again.
const QUIET_FOR = 2.5

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

// Wall text occupies roughly y 1.0–2.9 on the west wall between these z values.
const TEXT_BAND = { minZ: 0.6, maxZ: 7.6, minY: 0.95, maxY: 3 }

function layoutBadges(): Badge[] {
  const badges: Badge[] = []
  for (let i = 0; i < COUNT; i++) {
    const progress = i / (COUNT - 1)
    const z = THREE.MathUtils.clamp(7.4 - progress * 8.8 + (hash(i) - 0.5) * 2, -1.8, 7.6)
    const radius = 0.05 + 0.04 * hash(i + 50) + 0.32 * Math.pow(progress, 1.6)
    const surface = i % 5
    let position: [number, number, number]
    let rotation: [number, number, number]

    if (surface === 0) {
      // West wall: competes with the wall text without covering it.
      const inBand = z > TEXT_BAND.minZ && z < TEXT_BAND.maxZ
      const y = inBand ? (hash(i + 7) > 0.5 ? 3.25 + hash(i + 9) * 0.6 : 0.3 + hash(i + 9) * 0.45) : 0.5 + hash(i + 9) * 3.2
      position = [HALL.minX + 0.012, y, z]
      rotation = [0, Math.PI / 2, 0]
    } else if (surface === 1 || surface === 4) {
      position = [HALL.maxX - 0.012, 0.5 + hash(i + 9) * 3.2, z]
      rotation = [0, -Math.PI / 2, 0]
    } else if (surface === 2) {
      position = [(hash(i + 3) - 0.5) * 10, HALL.height - 0.012, z]
      // Facing down, numbers upright for a visitor walking north.
      rotation = [Math.PI / 2, 0, Math.PI]
    } else {
      position = [(hash(i + 3) - 0.5) * 9, 0.006, z]
      rotation = [-Math.PI / 2, 0, 0]
    }

    badges.push({ position, rotation, radius, label: countLabel(i), threshold: 7.4 - progress * 8.4 })
  }
  return badges
}

const easeOutBack = (x: number) => {
  const c1 = 1.70158
  const c3 = c1 + 1
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
}

const popScale = (t: number) => (t >= 0.28 ? 1 : easeOutBack(Math.max(0, t) / 0.28))

function BadgeMark({ radius, label, material }: { radius: number; label: string; material: THREE.Material }) {
  const fontSize = radius * (label.length > 2 ? 0.72 : label.length > 1 ? 0.95 : 1.15)
  return (
    <>
      <mesh geometry={CIRCLE} material={material} scale={radius} />
      <Text position={[0, 0, 0.003]} fontSize={fontSize} color="#ffffff" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </>
  )
}

/**
 * Exhibit 02. One small badge on a plinth, treated with museum seriousness. As the
 * visitor walks on, the count climbs and badges spread across walls, ceiling and floor.
 * "Mark all as read" clears them; a moment later they start coming back.
 */
export function NotificationBadges() {
  const { id: roomId, origin } = useRoom()
  const clock = useThree((state) => state.clock)
  const badges = useMemo(layoutBadges, [])
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: RED }), [])

  const groups = useRef<(THREE.Group | null)[]>([])
  const first = useRef<THREE.Group>(null)
  const shownAt = useRef(new Float32Array(COUNT).fill(-1))
  const scales = useRef(new Float32Array(COUNT))
  const deepest = useRef(Infinity)
  const clearedAt = useRef(-Infinity)
  const [count, setCount] = useState(1)

  useObstacle('badge-plinth', box(PLINTH.x, PLINTH.z, PLINTH.width, PLINTH.depth))
  useFocusTarget({
    id: 'notification-badge',
    position: [PLINTH.x, 1.2, PLINTH.z],
    distance: 3.4,
    card: CARDS.badge,
    prompt: 'MARK ALL AS READ',
    onInteract: () => {
      clearedAt.current = clock.elapsedTime
    },
  })

  useFrame(({ camera }, delta) => {
    const now = clock.elapsedTime
    if (museumStore.get().spaceId === roomId) deepest.current = Math.min(deepest.current, camera.position.z - origin[1])
    else deepest.current = Infinity

    let visible = 0
    for (let i = 0; i < COUNT; i++) {
      const show = deepest.current < badges[i].threshold && now > clearedAt.current + QUIET_FOR + i * 0.12
      if (show && shownAt.current[i] < 0) shownAt.current[i] = now
      if (!show) shownAt.current[i] = -1

      scales.current[i] = show ? popScale(now - shownAt.current[i]) : THREE.MathUtils.damp(scales.current[i], 0, 16, delta)
      const group = groups.current[i]
      if (group) {
        group.scale.setScalar(scales.current[i])
        group.visible = scales.current[i] > 0.002
      }
      if (show) visible++
    }

    const quiet = now < clearedAt.current + QUIET_FOR
    if (first.current) first.current.visible = !quiet
    const next = quiet ? 0 : visible + 1
    if (next !== count) setCount(next)
  })

  return (
    <>
      <group position={[PLINTH.x, 0, PLINTH.z]}>
        <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} />
        {/* An app icon, and the first, polite badge. */}
        <group position={[0, PLINTH.height + 0.3, 0]}>
          <mesh geometry={roundedRect(0.44, 0.44, 0.1)}>
            <meshStandardMaterial color="#3a3936" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
          <group ref={first} position={[0.2, 0.2, 0.01]}>
            <BadgeMark radius={0.075} label={count > 99 ? '99+' : String(Math.max(count, 1))} material={material} />
          </group>
        </group>
        <ExhibitLabel position={[-PLINTH.width / 2 + 0.1, PLINTH.height - 0.12, PLINTH.depth / 2 + 0.005]}>02 / 2007</ExhibitLabel>
        <pointLight position={[0, 3.2, 1]} intensity={5} distance={5} color="#efe6d6" />
      </group>

      {badges.map((badge, i) => (
        <group key={i} position={badge.position} rotation={badge.rotation}>
          <group
            ref={(node) => {
              groups.current[i] = node
            }}
            visible={false}
          >
            <BadgeMark radius={badge.radius} label={badge.label} material={material} />
          </group>
        </group>
      ))}
    </>
  )
}
