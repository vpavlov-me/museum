import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { INK_ON_LIGHT } from '../../../identity'
import { motion } from '../../../museum/capabilities'
import { useRoomFrame } from '../../../museum/RoomContext'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { CIRCLE, roundedRect } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial, OAK_MATERIAL, PALETTES } from '../../../scene/materials'
import { CARDS, LAYOUT } from '../content'
import { CEILING, SCREEN } from './shared'

const CARD = { width: 1.3, height: 0.95, pitch: 1.2 }
/** The column's half-width: cards hang on its four faces. */
const HALF = 0.7
const PER_FACE = 11
const SPAN = CARD.pitch * PER_FACE
/** Metres a second: slow enough to read one post as it passes eye level. */
const SPEED = 0.22
const LECTERN = { width: 1.4, depth: 0.5, height: 1.05 }
const IMAGES = ['#7b8c96', '#a08a6c', '#7d9479', '#927884', '#6c7da0', '#a39886', '#8c9aa6', '#b08f70'].map((c) => new THREE.Color(c))
const SLOT = basicMaterial('#2a2927')

/** Avatar, name and two lines of text: the same on every post, so one geometry. */
function inkGeometry() {
  const left = -CARD.width / 2 + 0.1
  const parts = [
    CIRCLE.clone().scale(0.06, 0.06, 1).translate(left + 0.06, 0.36, 0.002),
    roundedRect(0.42, 0.04, 0.02).clone().translate(left + 0.37, 0.37, 0.002),
    roundedRect(1.05, 0.035, 0.017).clone().translate(left + 0.525, -0.33, 0.002),
    roundedRect(0.7, 0.035, 0.017).clone().translate(left + 0.35, -0.4, 0.002),
  ]
  const merged = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return merged
}

const scratch = new THREE.Object3D()

/**
 * Exhibit 06 and the hall's key visual: Infinite Scroll. A square column of posts rising
 * out of a slot in the floor and into one in the ceiling, twelve metres up, on all four
 * sides, without end. It hangs still when less motion is asked for.
 */
export function Feed() {
  const [x, z] = LAYOUT.feed
  const panels = useRef<THREE.InstancedMesh>(null)
  const images = useRef<THREE.InstancedMesh>(null)
  const inks = useRef<THREE.InstancedMesh>(null)
  const ink = useMemo(inkGeometry, [])
  const picture = useMemo(() => new THREE.PlaneGeometry(CARD.width - 0.2, 0.46).translate(0, 0, 0.001), [])
  const count = PER_FACE * 4

  useObstacle('feed', box(x, z, HALF * 2 + 0.2, HALF * 2 + 0.2))
  useFocusTarget({ id: 'feed', position: [x, 1.6, z + HALF], distance: 4, card: CARDS.feed, labelled: true })

  const place = (time: number) => {
    for (let i = 0; i < count; i++) {
      const face = Math.floor(i / PER_FACE)
      const n = i % PER_FACE
      const angle = (face * Math.PI) / 2
      // Each face is half a post out of step with the next, so the column never reads as rows.
      const y = ((n * CARD.pitch + face * CARD.pitch * 0.5 + time * SPEED) % SPAN) - CARD.pitch / 2
      scratch.position.set(Math.sin(angle) * HALF, y, Math.cos(angle) * HALF)
      scratch.rotation.set(0, angle, 0)
      scratch.updateMatrix()
      panels.current?.setMatrixAt(i, scratch.matrix)
      images.current?.setMatrixAt(i, scratch.matrix)
      inks.current?.setMatrixAt(i, scratch.matrix)
    }
    for (const mesh of [panels.current, images.current, inks.current]) if (mesh) mesh.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    for (let i = 0; i < count; i++) images.current?.setColorAt(i, IMAGES[(i * 3) % IMAGES.length])
    if (images.current?.instanceColor) images.current.instanceColor.needsUpdate = true
    place(0)
  })

  useRoomFrame(({ clock }) => {
    if (!motion.reduced) place(clock.elapsedTime)
  })

  return (
    <>
      <group position={[x, 0, z]}>
        {/* The slots it rises out of and into. */}
        <mesh position={[0, 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} material={SLOT}>
          <planeGeometry args={[HALF * 2 + 0.2, HALF * 2 + 0.2]} />
        </mesh>
        <mesh position={[0, CEILING - 0.004, 0]} rotation={[Math.PI / 2, 0, 0]} material={SLOT}>
          <planeGeometry args={[HALF * 2 + 0.2, HALF * 2 + 0.2]} />
        </mesh>
        {/* The mast the posts travel on, in the hall's own concrete. */}
        <mesh position={[0, CEILING / 2, 0]} material={PALETTES.hall.wall}>
          <boxGeometry args={[HALF * 2 - 0.1, CEILING, HALF * 2 - 0.1]} />
        </mesh>
        <instancedMesh ref={panels} args={[roundedRect(CARD.width, CARD.height, 0.04), SCREEN.paper, count]} frustumCulled={false} />
        <instancedMesh ref={images} args={[picture, undefined, count]} frustumCulled={false}>
          <meshBasicMaterial />
        </instancedMesh>
        <instancedMesh ref={inks} args={[ink, SCREEN.line, count]} frustumCulled={false} />
      </group>
      <Lectern />
    </>
  )
}

/** The feed's label, on a slim oak lectern facing the entrance. */
function Lectern() {
  const [x, z] = LAYOUT.lectern
  useObstacle('feed-lectern', box(x, z, LECTERN.width, LECTERN.depth))
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, LECTERN.height / 2, 0]} material={OAK_MATERIAL}>
        <boxGeometry args={[LECTERN.width, LECTERN.height, LECTERN.depth]} />
      </mesh>
      <ExhibitLabel position={[-LECTERN.width / 2 + 0.1, LECTERN.height - 0.1, LECTERN.depth / 2 + 0.004]} exhibit={CARDS.feed} width={LECTERN.width - 0.2} ink={INK_ON_LIGHT} />
    </group>
  )
}
