import { useEffect, useRef } from 'react'
import { PointerLockControls, Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export type Exhibit = {
  id: string
  index: string
  year: string
  title: string
  category: string
  description: string
  position: [number, number, number]
  side: 'left' | 'right'
}

const EXHIBITS: Exhibit[] = [
  {
    id: 'raised',
    index: '01',
    year: '1995',
    title: 'The Raised Button',
    category: 'AFFORDANCE',
    description: 'Depth, highlights and shadow made interaction explicit. The interface borrowed the visual language of physical controls so a new digital behavior could feel familiar.',
    position: [-5.8, 1.35, 5.5],
    side: 'left',
  },
  {
    id: 'skeuo',
    index: '02',
    year: '2007',
    title: 'The Tactile Button',
    category: 'SKEUOMORPHISM',
    description: 'Polish became material. Gradients, gloss and rounded surfaces suggested something you could almost touch through glass.',
    position: [5.8, 1.35, 0.5],
    side: 'right',
  },
  {
    id: 'flat',
    index: '03',
    year: '2013',
    title: 'The Flat Button',
    category: 'FLAT DESIGN',
    description: 'Decoration was stripped away and typography carried more of the hierarchy. The button became a rectangle, a word, sometimes only a color change.',
    position: [-5.8, 1.35, -4.5],
    side: 'left',
  },
  {
    id: 'quiet',
    index: '04',
    year: '2026',
    title: 'The Quiet Button',
    category: 'CONTEMPORARY UI',
    description: 'Mature interfaces often reduce the visual weight of controls. Context, motion and system consistency now do work that borders and shadows once had to do.',
    position: [5.8, 1.35, -9.5],
    side: 'right',
  },
]

function Player({ active }: { active: boolean }) {
  const keys = useRef<Record<string, boolean>>({})
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true
    }
    const onUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  useFrame(({ camera }, delta) => {
    if (!active || !document.pointerLockElement) return

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).normalize()

    const speed = 4.2 * delta
    if (keys.current.KeyW) camera.position.addScaledVector(forward.current, speed)
    if (keys.current.KeyS) camera.position.addScaledVector(forward.current, -speed)
    if (keys.current.KeyD) camera.position.addScaledVector(right.current, speed)
    if (keys.current.KeyA) camera.position.addScaledVector(right.current, -speed)

    camera.position.x = THREE.MathUtils.clamp(camera.position.x, -7.2, 7.2)
    camera.position.z = THREE.MathUtils.clamp(camera.position.z, -12.2, 12.6)
    camera.position.y = 1.7
  })

  return null
}

function FocusDetector({ active, onFocus }: { active: boolean; onFocus: (exhibit: Exhibit | null) => void }) {
  const focusedId = useRef<string | null>(null)

  useFrame(({ camera }) => {
    if (!active) return

    let nearest: Exhibit | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const exhibit of EXHIBITS) {
      const dx = camera.position.x - exhibit.position[0]
      const dz = camera.position.z - exhibit.position[2]
      const distance = Math.hypot(dx, dz)
      if (distance < nearestDistance) {
        nearest = exhibit
        nearestDistance = distance
      }
    }

    const next = nearestDistance < 3.4 ? nearest : null
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

function WallText({
  position,
  rotation,
  kicker,
  title,
  body,
  align = 'left',
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  kicker: string
  title: string
  body: string
  align?: 'left' | 'right'
}) {
  const anchorX = align === 'left' ? 'left' : 'right'

  return (
    <group position={position} rotation={rotation}>
      <Text
        position={[0, 1.32, 0.01]}
        fontSize={0.18}
        letterSpacing={0.12}
        color="#9d9b95"
        anchorX={anchorX}
        anchorY="top"
      >
        {kicker}
      </Text>
      <Text
        position={[0, 0.95, 0.01]}
        fontSize={0.62}
        lineHeight={0.95}
        maxWidth={5.2}
        color="#efede6"
        anchorX={anchorX}
        anchorY="top"
        textAlign={align}
      >
        {title}
      </Text>
      <Text
        position={[0, 0.05, 0.01]}
        fontSize={0.22}
        lineHeight={1.5}
        maxWidth={5.2}
        color="#b7b4ad"
        anchorX={anchorX}
        anchorY="top"
        textAlign={align}
      >
        {body}
      </Text>
    </group>
  )
}

function ButtonObject({ exhibit, variant }: { exhibit: Exhibit; variant: number }) {
  const buttonColor = ['#d7d2c8', '#d7d2c8', '#3d6cff', '#e8e6df'][variant]
  const depths = [0.32, 0.22, 0.1, 0.06]
  const radii = [0.08, 0.22, 0.02, 0.18]
  const faceRotation: [number, number, number] = exhibit.side === 'left' ? [0, Math.PI / 2, 0] : [0, -Math.PI / 2, 0]
  const labelOffset = exhibit.side === 'left' ? 1.02 : -1.02

  return (
    <group position={exhibit.position}>
      <mesh position={[0, -0.94, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.16, 1.8]} />
        <meshStandardMaterial color="#232323" roughness={0.85} />
      </mesh>
      <mesh position={[0, -0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.35, 0.8, 1.35]} />
        <meshStandardMaterial color="#151515" roughness={0.7} />
      </mesh>

      <group rotation={faceRotation}>
        <mesh castShadow position={[0, 0.12, 0]}>
          <boxGeometry args={[2.15, 0.78, depths[variant]]} />
          <meshStandardMaterial color={buttonColor} roughness={variant === 1 ? 0.28 : 0.55} metalness={variant === 1 ? 0.08 : 0} />
        </mesh>
        <Text
          position={[0, 0.12, depths[variant] / 2 + 0.015]}
          fontSize={0.17}
          color={variant === 2 ? '#ffffff' : '#111111'}
          anchorX="center"
          anchorY="middle"
        >
          {variant === 0 ? 'SUBMIT' : variant === 1 ? 'Continue' : variant === 2 ? 'SAVE' : 'Continue →'}
        </Text>
      </group>

      <Text
        position={[labelOffset, -0.98, 0.98]}
        rotation={[-Math.PI / 2, 0, exhibit.side === 'left' ? Math.PI / 2 : -Math.PI / 2]}
        fontSize={0.14}
        color="#8e8b84"
        anchorX="left"
        anchorY="middle"
      >
        {exhibit.index} / {exhibit.year}
      </Text>

      {variant < 2 && (
        <mesh position={[0, 0.12, exhibit.side === 'left' ? depths[variant] * 0.35 : -depths[variant] * 0.35]} rotation={faceRotation}>
          <boxGeometry args={[2.02, 0.64, 0.012]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={radii[variant] * 0.35} />
        </mesh>
      )}
    </group>
  )
}

function Architecture() {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 28]} />
        <meshStandardMaterial color="#101010" roughness={0.96} />
      </mesh>

      <mesh position={[0, 5.2, 0]} receiveShadow>
        <boxGeometry args={[18, 0.18, 28]} />
        <meshStandardMaterial color="#0d0d0d" roughness={1} />
      </mesh>

      <mesh position={[-8.8, 2.6, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5.2, 28]} />
        <meshStandardMaterial color="#171717" roughness={0.92} />
      </mesh>
      <mesh position={[8.8, 2.6, 0]} receiveShadow>
        <boxGeometry args={[0.2, 5.2, 28]} />
        <meshStandardMaterial color="#171717" roughness={0.92} />
      </mesh>
      <mesh position={[0, 2.6, -13.9]} receiveShadow>
        <boxGeometry args={[18, 5.2, 0.2]} />
        <meshStandardMaterial color="#171717" roughness={0.92} />
      </mesh>

      <mesh position={[0, 2.6, 13.9]} receiveShadow>
        <boxGeometry args={[18, 5.2, 0.2]} />
        <meshStandardMaterial color="#111111" roughness={0.92} />
      </mesh>

      <mesh position={[0, 0.012, 7.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 0.025]} />
        <meshBasicMaterial color="#343434" />
      </mesh>
      <mesh position={[0, 0.012, -2.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 0.025]} />
        <meshBasicMaterial color="#343434" />
      </mesh>
      <mesh position={[0, 0.012, -7.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14, 0.025]} />
        <meshBasicMaterial color="#343434" />
      </mesh>
    </>
  )
}

export function Museum({ active, onFocus }: { active: boolean; onFocus: (exhibit: Exhibit | null) => void }) {
  return (
    <>
      <ambientLight intensity={0.46} />
      <directionalLight position={[0, 7, 8]} intensity={1.4} castShadow />
      <pointLight position={[-5, 3.4, 5.5]} intensity={7} distance={7} color="#ddd4c1" />
      <pointLight position={[5, 3.4, 0.5]} intensity={7} distance={7} color="#d9dedf" />
      <pointLight position={[-5, 3.4, -4.5]} intensity={7} distance={7} color="#d8d8e5" />
      <pointLight position={[5, 3.4, -9.5]} intensity={7} distance={7} color="#ddd4c1" />

      <Architecture />

      <Text
        position={[0, 3.5, -13.72]}
        fontSize={1.05}
        letterSpacing={-0.04}
        color="#efede6"
        anchorX="center"
        anchorY="middle"
      >
        THE BUTTON
      </Text>
      <Text
        position={[0, 2.58, -13.71]}
        fontSize={0.19}
        letterSpacing={0.11}
        color="#84817a"
        anchorX="center"
        anchorY="middle"
      >
        ROOM 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
      </Text>

      <WallText
        position={[-8.66, 2.7, 9.6]}
        rotation={[0, Math.PI / 2, 0]}
        kicker="INTRODUCTION / 01"
        title="A button is a promise."
        body="For decades, interface designers have been teaching people that a small surface on a screen can cause something to happen. Its appearance changed with every generation of software, but the contract remained surprisingly stable: this is a place where your intention becomes an action."
      />

      <WallText
        position={[8.66, 2.7, -3.4]}
        rotation={[0, -Math.PI / 2, 0]}
        kicker="OBSERVATION / 02"
        title="When the border disappeared."
        body="As people became fluent in digital interfaces, controls needed fewer physical metaphors. Shadows faded. Gradients flattened. Sometimes even the container vanished. Familiarity became part of the interface itself."
        align="right"
      />

      <WallText
        position={[-8.66, 2.7, -9.2]}
        rotation={[0, Math.PI / 2, 0]}
        kicker="QUESTION / 03"
        title="How little can a button look like a button?"
        body="The contemporary interface keeps testing the boundary between elegance and discoverability. Remove too much and the control becomes invisible. Add too much and it competes with the thing the user actually came to do."
      />

      {EXHIBITS.map((exhibit, index) => (
        <ButtonObject key={exhibit.id} exhibit={exhibit} variant={index} />
      ))}

      <Player active={active} />
      <FocusDetector active={active} onFocus={onFocus} />
      <PointerLockControls selector="#enter-museum" />
    </>
  )
}
