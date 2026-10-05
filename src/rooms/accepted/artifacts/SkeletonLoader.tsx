import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoom } from '../../../museum/RoomContext'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { CARDS } from '../content'
import { CIRCLE, roundedRect } from '../shared'

const BASE = new THREE.Color('#2a2927')
const SHINE = new THREE.Color('#4d4b47')
const SLAB = new THREE.Color('#1b1b1a')
const DEPTH = 0.12
// Walking up to a panel starts a fresh load; walking away re-arms it.
const ARRIVE = 4.2
const LEAVE = 6

type Shape = { kind: 'bar'; x0: number; x1: number; y: number; h: number } | { kind: 'circle'; x: number; y: number; r: number }

type Panel = { id: string; x: number; z: number; width: number; height: number; shapes: Shape[] }

// Two placeholder "pages", staggered like posts in a feed and standing in the way like
// partitions: the visitor has to walk around each one. Panel-local metres, y from the floor.
const PANELS: Panel[] = [
  {
    id: 'post',
    x: -1,
    z: -39.5,
    width: 3,
    height: 2.85,
    shapes: [
      { kind: 'circle', x: -1.13, y: 2.42, r: 0.18 },
      { kind: 'bar', x0: -0.85, x1: 0.25, y: 2.5, h: 0.1 },
      { kind: 'bar', x0: -0.85, x1: -0.2, y: 2.33, h: 0.07 },
      { kind: 'bar', x0: -1.3, x1: 1.3, y: 1.58, h: 0.95 },
      { kind: 'bar', x0: -1.3, x1: 1.1, y: 0.92, h: 0.08 },
      { kind: 'bar', x0: -1.3, x1: 0.8, y: 0.76, h: 0.08 },
      { kind: 'bar', x0: -1.3, x1: 0.15, y: 0.6, h: 0.08 },
    ],
  },
  {
    id: 'grid',
    x: 3.15,
    z: -43,
    width: 2.6,
    height: 2.6,
    shapes: [
      { kind: 'bar', x0: -1.1, x1: 0.35, y: 2.28, h: 0.13 },
      { kind: 'bar', x0: -1.1, x1: -0.35, y: 2.08, h: 0.07 },
      { kind: 'bar', x0: -1.1, x1: -0.06, y: 1.52, h: 0.62 },
      { kind: 'bar', x0: 0.06, x1: 1.1, y: 1.52, h: 0.62 },
      { kind: 'bar', x0: -1.1, x1: -0.06, y: 0.8, h: 0.62 },
      { kind: 'bar', x0: 0.06, x1: 1.1, y: 0.8, h: 0.62 },
    ],
  },
]

const shapeX = (shape: Shape) => (shape.kind === 'circle' ? shape.x : (shape.x0 + shape.x1) / 2)

function SkeletonPanel({ panel }: { panel: Panel }) {
  const clock = useThree((state) => state.clock)
  const { origin } = useRoom()
  // The first load "started" when the museum opened; by the time anyone arrives it has stalled.
  const refreshedAt = useRef(0)
  const armed = useRef(true)
  const progress = useRef<THREE.Mesh>(null)
  const materials = useMemo(() => panel.shapes.map(() => new THREE.MeshBasicMaterial({ color: BASE })), [panel])

  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials])

  useObstacle(`skeleton-${panel.id}`, box(panel.x, panel.z, panel.width, DEPTH + 0.1))
  useFocusTarget({ id: `skeleton-${panel.id}`, position: [panel.x, 1.5, panel.z], distance: 3.6, card: CARDS.skeleton, labelled: true })

  const barWidth = panel.width - 0.3

  useFrame(({ camera }) => {
    const now = clock.elapsedTime
    // Arriving is the refresh: nobody presses anything, the page simply starts loading again.
    const distance = Math.hypot(camera.position.x - origin[0] - panel.x, camera.position.z - origin[1] - panel.z)
    if (armed.current && distance < ARRIVE) {
      armed.current = false
      refreshedAt.current = now
    } else if (distance > LEAVE) armed.current = true

    const since = now - refreshedAt.current
    // After a refresh the shapes blink out, then the same shimmer starts again.
    const presence = THREE.MathUtils.clamp((since - 0.25) / 0.35, 0, 1)
    panel.shapes.forEach((shape, i) => {
      const wave = Math.pow(0.5 + 0.5 * Math.sin(now * 2.2 - (panel.x + shapeX(shape)) * 1.3), 3)
      materials[i].color.lerpColors(BASE, SHINE, wave).lerp(SLAB, 1 - presence)
    })
    // Crawls towards the end and never arrives.
    const filled = Math.max(0.001, 0.93 * (1 - Math.exp(-since * 0.45)))
    if (progress.current) {
      progress.current.scale.x = filled
      progress.current.position.x = (barWidth * filled) / 2
    }
  })

  const face = DEPTH / 2 + 0.002

  return (
    <group position={[panel.x, 0, panel.z]}>
      <mesh position={[0, panel.height / 2, 0]} material={PALETTES.accepted.reveal}>
        <boxGeometry args={[panel.width, panel.height, DEPTH]} />
      </mesh>

      {panel.shapes.map((shape, i) =>
        shape.kind === 'circle' ? (
          <mesh key={i} position={[shape.x, shape.y, face]} geometry={CIRCLE} scale={shape.r} material={materials[i]} />
        ) : (
          <mesh
            key={i}
            position={[(shape.x0 + shape.x1) / 2, shape.y, face]}
            geometry={roundedRect(shape.x1 - shape.x0, shape.h, Math.min(shape.h / 2, 0.05))}
            material={materials[i]}
          />
        ),
      )}

      <group position={[-barWidth / 2, panel.height - 0.1, face]}>
        <mesh ref={progress} position={[0, 0, 0.001]} scale={[0.001, 1, 1]} material={basicMaterial('#8f8c85')}>
          <planeGeometry args={[barWidth, 0.012]} />
        </mesh>
      </group>
    </group>
  )
}

/** Exhibit 05. Placeholders that start loading as you arrive, shimmer forever and never resolve into content. */
export function SkeletonLoader() {
  return (
    <>
      {PANELS.map((panel) => (
        <SkeletonPanel key={panel.id} panel={panel} />
      ))}
    </>
  )
}
