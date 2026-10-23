import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { facingRotation } from '../../../components/WallText'
import { INK_ON_LIGHT } from '../../../identity'
import { motion } from '../../../museum/capabilities'
import { useRoomFrame } from '../../../museum/RoomContext'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { CIRCLE, roundedRect } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial, FIXTURE_MATERIAL } from '../../../scene/materials'
import { CARDS, LAYOUT } from '../content'

const PANEL = { width: 2.6, height: 2.8, depth: 0.1, foot: 0.4 }
const FACE = basicMaterial('#f2f1ee')
const SHAPE = basicMaterial('#dddbd6')
/** The shimmer crosses a panel in this many seconds, again and again. */
const SWEEP = 1.8

type Shape = { kind: 'bar'; x0: number; x1: number; y: number; h: number } | { kind: 'circle'; x: number; y: number; r: number }

/** Two placeholder pages, panel-local metres from the panel's foot: a post, and a grid of tiles. */
const PAGES: Shape[][] = [
  [
    { kind: 'circle', x: -0.98, y: 2.42, r: 0.17 },
    { kind: 'bar', x0: -0.7, x1: 0.35, y: 2.5, h: 0.1 },
    { kind: 'bar', x0: -0.7, x1: -0.1, y: 2.33, h: 0.07 },
    { kind: 'bar', x0: -1.15, x1: 1.15, y: 1.55, h: 1 },
    { kind: 'bar', x0: -1.15, x1: 0.95, y: 0.86, h: 0.08 },
    { kind: 'bar', x0: -1.15, x1: 0.65, y: 0.7, h: 0.08 },
    { kind: 'bar', x0: -1.15, x1: 0.1, y: 0.54, h: 0.08 },
  ],
  [
    { kind: 'bar', x0: -1.15, x1: 0.2, y: 2.5, h: 0.12 },
    { kind: 'bar', x0: -1.15, x1: -0.05, y: 1.8, h: 0.95 },
    { kind: 'bar', x0: 0.05, x1: 1.15, y: 1.8, h: 0.95 },
    { kind: 'bar', x0: -1.15, x1: -0.05, y: 0.75, h: 0.95 },
    { kind: 'bar', x0: 0.05, x1: 1.15, y: 0.75, h: 0.95 },
  ],
]

/**
 * Exhibit 05. Two skeleton screens the size of partitions, standing in bay III: grey
 * shapes for content that never arrives, with the shimmer that says it is on its way.
 */
export function Skeletons() {
  const [lx, lz] = LAYOUT.skeletonLabel
  return (
    <>
      {LAYOUT.skeletons.map(([x, z], i) => (
        <Panel key={i} index={i} x={x} z={z} shapes={PAGES[i % PAGES.length]} />
      ))}
      <ExhibitLabel position={[lx - 0.02, 1.9, lz]} rotation={facingRotation('west')} exhibit={CARDS.skeleton} width={0.9} ink={INK_ON_LIGHT} />
    </>
  )
}

function Panel({ index, x, z, shapes }: { index: number; x: number; z: number; shapes: Shape[] }) {
  const shine = useRef<THREE.Mesh>(null)
  const material = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }), [])
  useObstacle(`skeleton-${index}`, box(x, z, PANEL.foot, PANEL.width))
  useFocusTarget({ id: `skeleton-${index}`, position: [x - 0.2, 1.4, z], card: CARDS.skeleton, labelled: true })

  useRoomFrame(({ clock }) => {
    if (!shine.current) return
    shine.current.visible = !motion.reduced
    const t = ((clock.elapsedTime + index * 0.6) % SWEEP) / SWEEP
    shine.current.position.x = -PANEL.width / 2 + 0.25 + t * (PANEL.width - 0.5)
  })

  const front = PANEL.depth / 2 + 0.002
  return (
    <group position={[x, 0, z]} rotation={facingRotation('west')}>
      <mesh position={[0, 0.025, 0]} material={FIXTURE_MATERIAL}>
        <boxGeometry args={[PANEL.width, 0.05, PANEL.foot]} />
      </mesh>
      <mesh position={[0, 0.05 + PANEL.height / 2, 0]} material={FACE}>
        <boxGeometry args={[PANEL.width, PANEL.height, PANEL.depth]} />
      </mesh>
      <group position={[0, 0.05, front]}>
        {shapes.map((shape, i) =>
          shape.kind === 'circle' ? (
            <mesh key={i} geometry={CIRCLE} position={[shape.x, shape.y, 0]} scale={shape.r} material={SHAPE} />
          ) : (
            <mesh key={i} geometry={roundedRect(shape.x1 - shape.x0, shape.h, Math.min(0.04, shape.h / 2))} position={[(shape.x0 + shape.x1) / 2, shape.y, 0]} material={SHAPE} />
          ),
        )}
        <mesh ref={shine} position={[0, PANEL.height / 2, 0.002]} material={material}>
          <planeGeometry args={[0.5, PANEL.height - 0.1]} />
        </mesh>
      </group>
    </group>
  )
}
