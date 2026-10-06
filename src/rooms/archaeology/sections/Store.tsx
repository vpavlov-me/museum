import { useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useSound } from '../../../audio/useSound'
import { Plinth } from '../../../components/Plinth'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { CIRCLE } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight, Luminaire } from '../../../scene/Light'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { CatalogueCard } from '../CatalogueCard'
import { ARCHIVE, ATTEMPTS_BEFORE, cardOf, CELLS, FINDS, type Find } from '../content'
import { CellSign } from './CellSign'

const cell = CELLS.store
const palette = PALETTES.archive

/*
 * III — THE STORE. Low and close: shelving of numbered boxes down both long walls, and
 * three vitrines down the middle, each holding one find with its card on the plinth.
 */
const CASE_X = 2.5
const PLINTH = { width: 1.15, height: 0.92, depth: 0.82 }
const GLASS = { width: 1.05, height: 0.56, depth: 0.72 }
const VITRINES = { inscriptions: -37, hoard: -41, oath: -45 } as const

const SHELF = { depth: 0.5, levels: [0.12, 0.62, 1.12, 1.62, 2.12], height: 2.5 }
const SHELVES = [
  { x: cell.minX + SHELF.depth / 2, from: -34.6, to: -46.4 },
  { x: cell.maxX - SHELF.depth / 2, from: -34.6, to: -45.2 },
]
const SHELF_MATERIAL = new THREE.MeshStandardMaterial({ color: '#34312d', roughness: 0.7 })
const BOX_MATERIAL = new THREE.MeshStandardMaterial({ color: '#6a6257', roughness: 0.95 })
const TAG_MATERIAL = basicMaterial('#a9a294')
const GLASS_MATERIAL = new THREE.MeshStandardMaterial({ color: '#cfd6d4', roughness: 0.1, transparent: true, opacity: 0.06, depthWrite: false })
const FRAME_MATERIAL = new THREE.MeshStandardMaterial({ color: '#2a2826', roughness: 0.5 })
const STONE = new THREE.MeshStandardMaterial({ color: '#7b746a', roughness: 0.95 })
const PAGE = new THREE.MeshStandardMaterial({ color: '#cfc8b8', roughness: 0.95 })
const HEART = new THREE.MeshStandardMaterial({ color: '#94403a', roughness: 0.7 })

const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

/** Shelving down a wall, with boxes on every shelf and a gap here and there. */
function Shelving() {
  const next = random(5)
  const pieces: ReactNode[] = []
  SHELVES.forEach(({ x, from, to }, side) => {
    const length = from - to
    const z = (from + to) / 2
    const face = side === 0 ? 1 : -1
    for (const level of SHELF.levels) {
      pieces.push(
        <mesh key={`s${side}${level}`} position={[x, level, z]} material={SHELF_MATERIAL}>
          <boxGeometry args={[SHELF.depth, 0.03, length]} />
        </mesh>,
      )
      for (let along = from - 0.25; along > to + 0.2; along -= 0.44) {
        if (next() < 0.12) continue
        const height = 0.28 + 0.08 * next()
        pieces.push(
          <mesh key={`b${side}${level}${along.toFixed(2)}`} position={[x, level + 0.015 + height / 2, along]} material={BOX_MATERIAL}>
            <boxGeometry args={[SHELF.depth - 0.08, height, 0.38]} />
          </mesh>,
          <mesh key={`t${side}${level}${along.toFixed(2)}`} position={[x + face * (SHELF.depth / 2 - 0.035), level + 0.015 + height * 0.62, along]} rotation={[0, face * Math.PI / 2, 0]} material={TAG_MATERIAL}>
            <planeGeometry args={[0.12, 0.06]} />
          </mesh>,
        )
      }
    }
    for (let along = from; along >= to - 0.01; along -= length / 4) {
      pieces.push(
        <mesh key={`u${side}${along.toFixed(2)}`} position={[x, SHELF.height / 2, along]} material={SHELF_MATERIAL}>
          <boxGeometry args={[SHELF.depth, SHELF.height, 0.04]} />
        </mesh>,
      )
    }
  })
  return <>{pieces}</>
}

/** A plinth with a glass case on it; the find stands on the plinth, its card on the front. */
function Vitrine({
  find,
  z,
  prompt,
  onInteract,
  note,
  children,
}: {
  find: Find
  z: number
  prompt?: string
  onInteract?: () => void
  note?: string
  children: ReactNode
}) {
  const card = useMemo(() => cardOf(find), [find])
  useObstacle(find.id, box(CASE_X, z, PLINTH.width + 0.1, PLINTH.depth + 0.1))
  useFocusTarget({ id: find.id, position: [CASE_X, 1.2, z], distance: 2.6, facing: 0.6, card, labelled: true, prompt, onInteract })

  const top = PLINTH.height
  return (
    <>
      <group position={[CASE_X, 0, z]}>
        <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} />
        <group position={[0, top, 0]}>{children}</group>
        <mesh position={[0, top + GLASS.height / 2, 0]} material={GLASS_MATERIAL} renderOrder={2}>
          <boxGeometry args={[GLASS.width, GLASS.height, GLASS.depth]} />
        </mesh>
        <mesh position={[0, top + GLASS.height, 0]} material={FRAME_MATERIAL}>
          <boxGeometry args={[GLASS.width + 0.02, 0.025, GLASS.depth + 0.02]} />
        </mesh>
        <CatalogueCard position={[0, PLINTH.height - 0.3, PLINTH.depth / 2 + 0.004]} find={find} width={0.86} height={0.5} note={note} />
      </group>
      <Downlight at={[CASE_X, z + 1.3]} aim={[CASE_X, top + 0.1, z]} ceiling={cell.height} palette={palette} angle={0.38} penumbra={0.8} intensity={45} distance={7} />
    </>
  )
}

const DOTS = { rows: 4, columns: 9, gap: 0.075, radius: 0.019 }
const DECIPHER_SECONDS = 1.4

/** A stone tablet with rows of identical marks. DECIPHER tries; the marks shiver and settle unread. */
function Inscriptions() {
  const [attempts, setAttempts] = useState(ATTEMPTS_BEFORE)
  const dots = useRef<THREE.InstancedMesh>(null)
  const startedAt = useRef(-Infinity)
  const elapsed = useRef(0)
  const play = useSound()
  const matrix = useMemo(() => new THREE.Matrix4(), [])
  const positions = useMemo(
    () =>
      Array.from({ length: DOTS.rows * DOTS.columns }, (_, i) => {
        const row = Math.floor(i / DOTS.columns)
        const column = i % DOTS.columns
        return [(column - (DOTS.columns - 1) / 2) * DOTS.gap, ((DOTS.rows - 1) / 2 - row) * DOTS.gap * 1.5] as const
      }),
    [],
  )

  const place = (shake: number) => {
    const mesh = dots.current
    if (!mesh) return
    positions.forEach(([x, y], i) => {
      const s = 1 + shake * Math.sin(elapsed.current * 40 + i * 2.1)
      matrix.makeScale(DOTS.radius * s, DOTS.radius * s, 1).setPosition(x + shake * 0.006 * Math.sin(i * 7.3 + elapsed.current * 30), y, 0)
      mesh.setMatrixAt(i, matrix)
    })
    mesh.instanceMatrix.needsUpdate = true
  }

  useRoomFrame((_, delta) => {
    elapsed.current += delta
    const age = elapsed.current - startedAt.current
    if (age < 0 || age > DECIPHER_SECONDS + 0.1) return
    place(age < DECIPHER_SECONDS ? Math.sin((age / DECIPHER_SECONDS) * Math.PI) * 0.5 : 0)
  })

  const decipher = () => {
    startedAt.current = elapsed.current
    setAttempts((n) => n + 1)
    play('decipher', [CASE_X, PLINTH.height + 0.2, VITRINES.inscriptions])
  }

  return (
    <Vitrine find={FINDS.inscriptions} z={VITRINES.inscriptions} prompt="DECIPHER" onInteract={decipher} note={`ATTEMPTS: ${attempts.toLocaleString('en-US')}   ·   NO READING`}>
      <group position={[0, 0.2, 0]} rotation={[-0.35, 0, 0]}>
        <mesh material={STONE}>
          <boxGeometry args={[0.82, 0.46, 0.05]} />
        </mesh>
        <instancedMesh
          ref={(mesh) => {
            dots.current = mesh
            if (mesh) place(0)
          }}
          args={[CIRCLE, basicMaterial('#2c2925'), DOTS.rows * DOTS.columns]}
          position={[0, 0, 0.027]}
        />
      </group>
    </Vitrine>
  )
}

const HEART_SHAPE = (() => {
  const shape = new THREE.Shape()
  shape.moveTo(0, -0.5)
  shape.bezierCurveTo(-0.15, -0.3, -0.5, -0.1, -0.5, 0.15)
  shape.bezierCurveTo(-0.5, 0.4, -0.2, 0.5, 0, 0.28)
  shape.bezierCurveTo(0.2, 0.5, 0.5, 0.4, 0.5, 0.15)
  shape.bezierCurveTo(0.5, -0.1, 0.15, -0.3, 0, -0.5)
  // Indexed, so that StaticMerge can merge the hoard into one draw.
  return mergeVertices(new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: false, curveSegments: 6 }))
})()

/** A shallow tray heaped with tokens, more than anyone could count. */
function Hoard() {
  const hearts = useMemo(() => {
    const next = random(23)
    return Array.from({ length: 110 }, () => {
      const r = Math.sqrt(next()) * 0.3
      const a = next() * Math.PI * 2
      const x = Math.cos(a) * r * 1.25
      const z = Math.sin(a) * r
      return { x, z, y: 0.04 + (0.3 - r) * 0.42 * next() + 0.01, rx: next() * 6.28, ry: next() * 6.28, rz: next() * 6.28 }
    })
  }, [])

  return (
    <Vitrine find={FINDS.hoard} z={VITRINES.hoard}>
      <StaticMerge>
        <mesh position={[0, 0.02, 0]} material={FRAME_MATERIAL}>
          <boxGeometry args={[0.9, 0.04, 0.6]} />
        </mesh>
        {hearts.map(({ x, y, z, rx, ry, rz }, i) => (
          <mesh key={i} position={[x, y, z]} rotation={[rx, ry, rz]} scale={0.055} geometry={HEART_SHAPE} material={HEART} />
        ))}
      </StaticMerge>
    </Vitrine>
  )
}

/** A stack of copies of the full text, and on top the one line everybody signed. */
function Oath() {
  const pages = useMemo(() => {
    const next = random(41)
    return Array.from({ length: 34 }, (_, i) => ({ y: 0.006 + i * 0.007, x: (next() - 0.5) * 0.02, r: (next() - 0.5) * 0.06 }))
  }, [])
  const top = pages[pages.length - 1].y + 0.004

  return (
    <Vitrine find={FINDS.oath} z={VITRINES.oath}>
      <StaticMerge>
        {pages.map(({ y, x, r }, i) => (
          <mesh key={i} position={[x - 0.12, y, 0]} rotation={[0, r, 0]} material={PAGE}>
            <boxGeometry args={[0.42, 0.006, 0.56]} />
          </mesh>
        ))}
        {/* The page that was signed: a small square, and its mark. */}
        <mesh position={[0.3, 0.004, 0.05]} rotation={[-Math.PI / 2, 0, -0.08]} material={PAGE}>
          <planeGeometry args={[0.36, 0.22]} />
        </mesh>
      </StaticMerge>
      <group position={[0.3, 0.006, 0.05]} rotation={[-Math.PI / 2, 0, -0.08]}>
        <mesh position={[-0.13, 0, 0]} material={basicMaterial(ARCHIVE.ink)}>
          <planeGeometry args={[0.05, 0.05]} />
        </mesh>
        <mesh position={[-0.13, 0, 0.001]} material={basicMaterial('#cfc8b8')}>
          <planeGeometry args={[0.04, 0.04]} />
        </mesh>
        {/* The mark: two strokes. */}
        <mesh position={[-0.138, -0.004, 0.002]} rotation={[0, 0, 0.8]} material={basicMaterial(ARCHIVE.ink)}>
          <planeGeometry args={[0.022, 0.006]} />
        </mesh>
        <mesh position={[-0.122, 0.004, 0.002]} rotation={[0, 0, -0.9]} material={basicMaterial(ARCHIVE.ink)}>
          <planeGeometry args={[0.04, 0.006]} />
        </mesh>
        <Text position={[-0.09, 0, 0.002]} fontSize={0.018} maxWidth={0.2} lineHeight={1.3} color={ARCHIVE.ink} anchorX="left" anchorY="middle">
          I have read and agree to the Terms of Service
        </Text>
      </group>
      <Text position={[-0.12, top, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.016} maxWidth={0.36} lineHeight={1.5} color={ARCHIVE.inkMuted} anchorX="center" anchorY="middle">
        {'TERMS OF SERVICE\n\n1. Acceptance of terms. By accessing or using the service you agree to be bound by these terms and by all policies referenced herein, as amended from time to time…'}
      </Text>
    </Vitrine>
  )
}

export function Store() {
  return (
    <>
      <StaticMerge>
        <Shelving />
        {/* Two slots over the aisles either side of the cases. */}
        {[0.3, 4.7].map((x) => (
          <Luminaire key={x} position={[x, cell.height - 0.004, (cell.minZ + cell.maxZ) / 2]} size={[0.12, cell.maxZ - cell.minZ - 3]} palette={palette} />
        ))}
      </StaticMerge>

      <Inscriptions />
      <Hoard />
      <Oath />

      <CellSign position={[cell.minX + 0.9, 2.95, cell.minZ + 0.02]} kicker="04 / III" name="THE STORE" />
    </>
  )
}
