import { useCallback, useEffect, useRef } from 'react'
import { PointerLockControls, RoundedBox, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

type ArtifactStyle = 'bevel' | 'gloss' | 'flat' | 'quiet'

export type Exhibit = {
  id: string
  index: string
  year: string
  title: string
  category: string
  description: string
  /** Plinth centre on the floor plane: [x, z]. */
  position: [number, number]
  side: 'left' | 'right'
  artifact: { style: ArtifactStyle; label: string }
}

type WallTextData = {
  id: string
  wall: 'left' | 'right'
  /** Z coordinate where the text block begins (reading direction runs along the wall). */
  start: number
  kicker: string
  title: string
  body: string
}

// Room 01 shell, in metres. Inner faces of the walls.
const ROOM = { halfWidth: 8.7, halfLength: 13.8, height: 5.2 }
const EYE_HEIGHT = 1.7
const PLAYER_RADIUS = 0.45
const WALK_SPEED = 2.2
const PLINTH = { width: 2.6, height: 0.95, depth: 0.9 }
const FOCUS_DISTANCE = 3.2

const EXHIBITS: Exhibit[] = [
  {
    id: 'raised',
    index: '01',
    year: '1995',
    title: 'The Raised Button',
    category: 'AFFORDANCE',
    description: 'Depth, highlights and shadow made interaction explicit. The interface borrowed the visual language of physical controls so a new digital behavior could feel familiar.',
    position: [5.6, 8.5],
    side: 'right',
    artifact: { style: 'bevel', label: 'SUBMIT' },
  },
  {
    id: 'skeuo',
    index: '02',
    year: '2007',
    title: 'The Tactile Button',
    category: 'SKEUOMORPHISM',
    description: 'Polish became material. Gradients, gloss and rounded surfaces suggested something you could almost touch through glass.',
    position: [-5.6, 2.5],
    side: 'left',
    artifact: { style: 'gloss', label: 'Continue' },
  },
  {
    id: 'flat',
    index: '03',
    year: '2013',
    title: 'The Flat Button',
    category: 'FLAT DESIGN',
    description: 'Decoration was stripped away and typography carried more of the hierarchy. The button became a rectangle, a word, sometimes only a color change.',
    position: [-5.6, -3.5],
    side: 'left',
    artifact: { style: 'flat', label: 'SAVE' },
  },
  {
    id: 'quiet',
    index: '04',
    year: '2026',
    title: 'The Quiet Button',
    category: 'CONTEMPORARY UI',
    description: 'Mature interfaces often reduce the visual weight of controls. Context, motion and system consistency now do work that borders and shadows once had to do.',
    position: [5.6, -10],
    side: 'right',
    artifact: { style: 'quiet', label: 'Continue →' },
  },
]

const WALL_TEXTS: WallTextData[] = [
  {
    id: 'intro',
    wall: 'left',
    start: 12.4,
    kicker: 'INTRODUCTION / 01',
    title: 'A button is a promise.',
    body: 'For decades, interface designers have been teaching people that a small surface on a screen can cause something to happen. Its appearance changed with every generation of software, but the contract remained surprisingly stable: this is a place where your intention becomes an action.',
  },
  {
    id: 'observation',
    wall: 'right',
    start: -7,
    kicker: 'OBSERVATION / 02',
    title: 'When the border disappeared.',
    body: 'As people became fluent in digital interfaces, controls needed fewer physical metaphors. Shadows faded. Gradients flattened. Sometimes even the container vanished. Familiarity became part of the interface itself.',
  },
  {
    id: 'question',
    wall: 'left',
    start: -5.6,
    kicker: 'QUESTION / 03',
    title: 'How little can a button look like a button?',
    body: 'The contemporary interface keeps testing the boundary between elegance and discoverability. Remove too much and the control becomes invisible. Add too much and it competes with the thing the user actually came to do.',
  },
]

// Floor thresholds between exhibit zones.
const THRESHOLDS = [5.5, -0.5, -6.8]

const faceRotation = (side: 'left' | 'right'): [number, number, number] =>
  side === 'left' ? [0, Math.PI / 2, 0] : [0, -Math.PI / 2, 0]

function Player({ active }: { active: boolean }) {
  const keys = useRef<Record<string, boolean>>({})
  const velocity = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true
    }
    const onUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }
    const reset = () => {
      keys.current = {}
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', reset)
    }
  }, [])

  useEffect(() => {
    if (!active) {
      keys.current = {}
      velocity.current.set(0, 0, 0)
    }
  }, [active])

  useFrame(({ camera }, rawDelta) => {
    if (!active) return
    const delta = Math.min(rawDelta, 0.1)

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).normalize()

    const k = keys.current
    wish.current.set(0, 0, 0)
    if (k.KeyW) wish.current.add(forward.current)
    if (k.KeyS) wish.current.sub(forward.current)
    if (k.KeyD) wish.current.add(right.current)
    if (k.KeyA) wish.current.sub(right.current)
    if (wish.current.lengthSq() > 0) wish.current.normalize().multiplyScalar(WALK_SPEED)

    // Ease in and out of walking instead of starting and stopping instantly.
    velocity.current.lerp(wish.current, 1 - Math.exp(-8 * delta))
    camera.position.addScaledVector(velocity.current, delta)

    const p = camera.position
    for (const exhibit of EXHIBITS) {
      // Plinths are rotated to face the aisle, so their long side runs along z.
      const halfX = PLINTH.depth / 2 + PLAYER_RADIUS
      const halfZ = PLINTH.width / 2 + PLAYER_RADIUS
      const dx = p.x - exhibit.position[0]
      const dz = p.z - exhibit.position[1]
      const overlapX = halfX - Math.abs(dx)
      const overlapZ = halfZ - Math.abs(dz)
      if (overlapX > 0 && overlapZ > 0) {
        if (overlapX < overlapZ) p.x += Math.sign(dx || 1) * overlapX
        else p.z += Math.sign(dz || 1) * overlapZ
      }
    }

    p.x = THREE.MathUtils.clamp(p.x, -ROOM.halfWidth + PLAYER_RADIUS, ROOM.halfWidth - PLAYER_RADIUS)
    p.z = THREE.MathUtils.clamp(p.z, -ROOM.halfLength + PLAYER_RADIUS, ROOM.halfLength - PLAYER_RADIUS)
    p.y = EYE_HEIGHT
  })

  return null
}

function FocusDetector({ active, onFocus }: { active: boolean; onFocus: (exhibit: Exhibit | null) => void }) {
  const focusedId = useRef<string | null>(null)
  const look = useRef(new THREE.Vector3())

  useFrame(({ camera }) => {
    if (!active) return

    camera.getWorldDirection(look.current)
    look.current.y = 0
    look.current.normalize()

    let nearest: Exhibit | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const exhibit of EXHIBITS) {
      const dx = exhibit.position[0] - camera.position.x
      const dz = exhibit.position[1] - camera.position.z
      const distance = Math.hypot(dx, dz)
      // Only describe an object the visitor is roughly looking towards.
      const facing = distance > 0 ? (dx * look.current.x + dz * look.current.z) / distance : 1
      if (distance < nearestDistance && facing > 0.35) {
        nearest = exhibit
        nearestDistance = distance
      }
    }

    const next = nearestDistance < FOCUS_DISTANCE ? nearest : null
    const nextId = next?.id ?? null
    if (nextId !== focusedId.current) {
      focusedId.current = nextId
      onFocus(next)
    }
  })

  useEffect(() => {
    if (!active) {
      focusedId.current = null
      onFocus(null)
    }
  }, [active, onFocus])

  return null
}

// Two-column wall label: kicker + title on the left, essay on the right.
// Both columns hang from the same top line so the block stays near eye level.
const WALL_LAYOUT = { top: 2.55, titleWidth: 3.2, gap: 0.45, bodyWidth: 4 }

function WallText({ text }: { text: WallTextData }) {
  const x = text.wall === 'left' ? -ROOM.halfWidth + 0.02 : ROOM.halfWidth - 0.02
  const { top, titleWidth, gap, bodyWidth } = WALL_LAYOUT

  return (
    <group position={[x, 0, text.start]} rotation={faceRotation(text.wall)}>
      <Text
        position={[0, top + 0.32, 0]}
        fontSize={0.11}
        letterSpacing={0.14}
        color="#8f8c85"
        anchorX="left"
        anchorY="top"
      >
        {text.kicker}
      </Text>
      <Text
        position={[0, top, 0]}
        fontSize={0.4}
        lineHeight={1.05}
        letterSpacing={-0.02}
        maxWidth={titleWidth}
        color="#efede6"
        anchorX="left"
        anchorY="top"
      >
        {text.title}
      </Text>
      <Text
        position={[titleWidth + gap, top - 0.03, 0]}
        fontSize={0.155}
        lineHeight={1.55}
        maxWidth={bodyWidth}
        color="#bdbab2"
        anchorX="left"
        anchorY="top"
      >
        {text.body}
      </Text>
    </group>
  )
}

const BUTTON = { width: 1.9, height: 0.62 }

function Artifact({ style, label }: { style: ArtifactStyle; label: string }) {
  const { width, height } = BUTTON

  if (style === 'bevel') {
    // Windows-era control: grey slab, light top-left edge, dark bottom-right edge.
    const d = 0.18
    const edge = 0.045
    const z = d / 2 + 0.002
    return (
      <group>
        <mesh>
          <boxGeometry args={[width, height, d]} />
          <meshStandardMaterial color="#c4c2bc" roughness={0.85} />
        </mesh>
        <mesh position={[0, height / 2 - edge / 2, z]}>
          <planeGeometry args={[width, edge]} />
          <meshBasicMaterial color="#f4f2ec" />
        </mesh>
        <mesh position={[-width / 2 + edge / 2, 0, z]}>
          <planeGeometry args={[edge, height]} />
          <meshBasicMaterial color="#f4f2ec" />
        </mesh>
        <mesh position={[0, -height / 2 + edge / 2, z + 0.001]}>
          <planeGeometry args={[width, edge]} />
          <meshBasicMaterial color="#4a4946" />
        </mesh>
        <mesh position={[width / 2 - edge / 2, 0, z + 0.001]}>
          <planeGeometry args={[edge, height]} />
          <meshBasicMaterial color="#4a4946" />
        </mesh>
        <Text position={[0, 0, z + 0.002]} fontSize={0.15} letterSpacing={0.04} color="#111111" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    )
  }

  if (style === 'gloss') {
    // Aqua-era pill: rounded, glossy, with a glassy highlight on the upper half.
    const d = 0.24
    return (
      <group>
        <RoundedBox args={[width, height, d]} radius={0.115} smoothness={6}>
          <meshPhysicalMaterial color="#2f7fd8" roughness={0.22} clearcoat={1} clearcoatRoughness={0.08} />
        </RoundedBox>
        <mesh position={[0, 0.135, d / 2 + 0.003]}>
          <planeGeometry args={[width - 0.32, 0.11]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.32} depthWrite={false} />
        </mesh>
        <Text position={[0, -0.04, d / 2 + 0.006]} fontSize={0.17} color="#ffffff" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    )
  }

  if (style === 'flat') {
    // Flat era: an unlit rectangle. It ignores the room's light on purpose.
    const d = 0.03
    return (
      <group>
        <mesh>
          <boxGeometry args={[width, height, d]} />
          <meshBasicMaterial color="#2f63f0" />
        </mesh>
        <Text position={[0, 0, d / 2 + 0.002]} fontSize={0.14} letterSpacing={0.1} color="#ffffff" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    )
  }

  // Quiet: the container nearly dissolves into the plinth; only the word and a hairline remain.
  const d = 0.012
  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, d]} />
        <meshStandardMaterial color="#1c1c1b" roughness={0.9} />
      </mesh>
      <Text position={[0, 0.02, d / 2 + 0.002]} fontSize={0.17} letterSpacing={-0.01} color="#efede6" anchorX="center" anchorY="middle">
        {label}
      </Text>
      <mesh position={[0, -0.12, d / 2 + 0.002]}>
        <planeGeometry args={[0.92, 0.006]} />
        <meshBasicMaterial color="#8f8c85" />
      </mesh>
    </group>
  )
}

function ExhibitStand({ exhibit }: { exhibit: Exhibit }) {
  const [x, z] = exhibit.position

  return (
    <group position={[x, 0, z]} rotation={faceRotation(exhibit.side)}>
      <mesh position={[0, PLINTH.height / 2, 0]}>
        <boxGeometry args={[PLINTH.width, PLINTH.height, PLINTH.depth]} />
        <meshStandardMaterial color="#141414" roughness={0.8} />
      </mesh>

      <group position={[0, PLINTH.height + BUTTON.height / 2 + 0.02, 0]}>
        <Artifact style={exhibit.artifact.style} label={exhibit.artifact.label} />
      </group>

      <Text
        position={[-PLINTH.width / 2 + 0.12, PLINTH.height - 0.14, PLINTH.depth / 2 + 0.005]}
        fontSize={0.075}
        letterSpacing={0.14}
        color="#8f8c85"
        anchorX="left"
        anchorY="top"
      >
        {`${exhibit.index} / ${exhibit.year}`}
      </Text>

      <pointLight position={[0, 3.4, 1.2]} intensity={9} distance={6} color="#efe6d6" />
    </group>
  )
}

function Architecture() {
  const { halfWidth, halfLength, height } = ROOM
  const width = halfWidth * 2
  const length = halfLength * 2

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, length]} />
        <meshStandardMaterial color="#232221" roughness={0.9} />
      </mesh>

      <mesh position={[0, height + 0.09, 0]}>
        <boxGeometry args={[width + 0.4, 0.18, length + 0.4]} />
        <meshStandardMaterial color="#0d0d0d" roughness={1} />
      </mesh>

      <mesh position={[-halfWidth - 0.1, height / 2, 0]}>
        <boxGeometry args={[0.2, height, length + 0.4]} />
        <meshStandardMaterial color="#3a3936" roughness={0.92} />
      </mesh>
      <mesh position={[halfWidth + 0.1, height / 2, 0]}>
        <boxGeometry args={[0.2, height, length + 0.4]} />
        <meshStandardMaterial color="#3a3936" roughness={0.92} />
      </mesh>
      <mesh position={[0, height / 2, -halfLength - 0.1]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color="#3a3936" roughness={0.92} />
      </mesh>
      <mesh position={[0, height / 2, halfLength + 0.1]}>
        <boxGeometry args={[width, height, 0.2]} />
        <meshStandardMaterial color="#2e2d2b" roughness={0.92} />
      </mesh>

      {THRESHOLDS.map((z) => (
        <mesh key={z} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width - 3, 0.025]} />
          <meshBasicMaterial color="#303030" />
        </mesh>
      ))}
    </>
  )
}

export function Museum({
  active,
  onFocus,
  onLockChange,
}: {
  active: boolean
  onFocus: (exhibit: Exhibit | null) => void
  onLockChange: (locked: boolean) => void
}) {
  const handleLock = useCallback(() => onLockChange(true), [onLockChange])
  const handleUnlock = useCallback(() => onLockChange(false), [onLockChange])

  return (
    <>
      <hemisphereLight args={['#d9d4c8', '#1a1a1a', 0.9]} />
      <directionalLight position={[3, 7, 10]} intensity={0.9} />

      <Architecture />

      <Text
        position={[0, 3.3, -ROOM.halfLength + 0.02]}
        fontSize={1.05}
        letterSpacing={-0.04}
        color="#efede6"
        anchorX="center"
        anchorY="middle"
      >
        THE BUTTON
      </Text>
      <Text
        position={[0, 2.45, -ROOM.halfLength + 0.02]}
        fontSize={0.17}
        letterSpacing={0.12}
        color="#8f8c85"
        anchorX="center"
        anchorY="middle"
      >
        ROOM 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
      </Text>
      <pointLight position={[0, 3.6, -10.5]} intensity={12} distance={9} color="#efe6d6" />

      {WALL_TEXTS.map((text) => (
        <WallText key={text.id} text={text} />
      ))}

      {EXHIBITS.map((exhibit) => (
        <ExhibitStand key={exhibit.id} exhibit={exhibit} />
      ))}

      <Player active={active} />
      <FocusDetector active={active} onFocus={onFocus} />
      <PointerLockControls
        selector="#enter-museum, #resume-museum"
        onLock={handleLock}
        onUnlock={handleUnlock}
        pointerSpeed={0.8}
        minPolarAngle={Math.PI * 0.22}
        maxPolarAngle={Math.PI * 0.78}
      />
    </>
  )
}

