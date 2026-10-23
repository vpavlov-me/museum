import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { ExhibitLabel } from '../../components/ExhibitLabel'
import { INK_ON_LIGHT as INK } from '../../identity'
import { motion } from '../../museum/capabilities'
import { BUTTON_HALL } from '../../museum/roomRegistry'
import { useRoomFrame } from '../../museum/RoomContext'
import { box } from '../../museum/types'
import { useObstacle } from '../../scene/Collision'
import { useFocusTarget } from '../../scene/Interaction'
import { FIXTURE_MATERIAL, OAK_MATERIAL } from '../../scene/materials'
import { KEY_VISUAL } from './content'

const FRAMES = 24
const RING = { radius: 3.8, height: 3.4, turn: 240 }
const FRAME = { width: 0.78, height: 0.58, bar: 0.022, depth: 0.03 }
const KEY = { width: 0.5, height: 0.2, travel: 0.2 }
/** Seconds for the press to pass once round the ring: one frame a second. */
const WAVE = FRAMES
const LECTERN = { width: 1.4, depth: 0.5, height: 1.05 }

/**
 * One press over its cycle, phase 0…1: at rest, down fast, held, let go more slowly,
 * a small overshoot, at rest. The 24 frames hold 24 phases of it at once.
 */
function press(phase: number) {
  if (phase < 0.2) return 0
  if (phase < 0.3) return easeIn((phase - 0.2) / 0.1)
  if (phase < 0.45) return 1
  if (phase < 0.7) return 1 - easeOut((phase - 0.45) / 0.25) * 1.08
  if (phase < 0.8) return -0.08 * (1 - (phase - 0.7) / 0.1)
  return 0
}
const easeIn = (x: number) => x * x
const easeOut = (x: number) => 1 - (1 - x) * (1 - x)

/** The four materials a button has been made of, six frames each round the ring. */
function useStyles() {
  return useMemo(() => {
    const bevel = { geometry: new THREE.BoxGeometry(KEY.width, KEY.height, 0.1), material: new THREE.MeshStandardMaterial({ color: '#c4c2bc', roughness: 0.85 }) }
    const gel = new THREE.CapsuleGeometry(KEY.height / 2, KEY.width - KEY.height, 8, 24)
    gel.rotateZ(Math.PI / 2)
    gel.scale(1, 1, 0.45)
    const gloss = { geometry: gel, material: new THREE.MeshPhysicalMaterial({ color: '#3a8ae6', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 }) }
    const flat = { geometry: new THREE.BoxGeometry(KEY.width, KEY.height, 0.016), material: new THREE.MeshBasicMaterial({ color: '#2f63f0' }) }
    const light = { geometry: new THREE.BoxGeometry(KEY.width, KEY.height, 0.01), material: new THREE.MeshBasicMaterial({ color: '#fdfbf7' }) }
    return [bevel, gloss, flat, light]
  }, [])
}

/** A frame's bronze outline, as one geometry. */
function frameGeometry() {
  const { width: w, height: h, bar: b, depth: d } = FRAME
  const parts = [
    new THREE.BoxGeometry(w, b, d).translate(0, h / 2 - b / 2, 0),
    new THREE.BoxGeometry(w, b, d).translate(0, -h / 2 + b / 2, 0),
    new THREE.BoxGeometry(b, h - 2 * b, d).translate(-w / 2 + b / 2, 0, 0),
    new THREE.BoxGeometry(b, h - 2 * b, d).translate(w / 2 - b / 2, 0, 0),
  ]
  const merged = mergeGeometries(parts)
  parts.forEach((part) => part.dispose())
  return merged
}

const scratch = new THREE.Object3D()

/** Where frame i hangs on the ring, facing out, with its button pressed `depth` (0…1) into it. */
function place(i: number, depth: number) {
  const angle = (i / FRAMES) * Math.PI * 2
  scratch.position.set(Math.sin(angle) * RING.radius, RING.height, Math.cos(angle) * RING.radius)
  scratch.rotation.set(0, angle, 0)
  // Pressed means pushed back into the frame, towards the centre of the ring.
  scratch.translateZ(-depth * KEY.travel)
  scratch.updateMatrix()
  return scratch.matrix
}

/**
 * The key visual (#48): Twenty-Four Frames. A press taken apart like Muybridge's horse,
 * 24 phases of one click in bronze frames hung in a ring 7.6 m across over the centre of the hall,
 * turning slowly while the press passes round it like a wave. Nothing to do but look.
 * With less motion asked for, it hangs still: the press, decomposed.
 */
export function KeyVisual() {
  const [cx, cz] = KEY_VISUAL.centre
  const ring = useRef<THREE.Group>(null)
  const keys = useRef<(THREE.InstancedMesh | null)[]>([])
  const styles = useStyles()
  const frame = useMemo(frameGeometry, [])
  const frames = useRef<THREE.InstancedMesh>(null)
  const cables = useRef<THREE.InstancedMesh>(null)
  const cableLength = BUTTON_HALL.height - RING.height - FRAME.height / 2

  useEffect(
    () => () => {
      frame.dispose()
      styles.forEach(({ geometry, material }) => {
        geometry.dispose()
        material.dispose()
      })
    },
    [frame, styles],
  )

  const pose = (time: number) => {
    const shift = (time / WAVE) % 1
    keys.current.forEach((mesh, style) => {
      if (!mesh) return
      for (let k = 0; k < FRAMES / 4; k++) {
        const i = style * (FRAMES / 4) + k
        mesh.setMatrixAt(k, place(i, press((i / FRAMES + 1 - shift) % 1)))
      }
      mesh.instanceMatrix.needsUpdate = true
    })
  }

  useLayoutEffect(() => {
    for (let i = 0; i < FRAMES; i++) {
      frames.current?.setMatrixAt(i, place(i, 0))
      // Two cables to each frame, from its top corners to the ceiling.
      for (const side of [-1, 1]) {
        const angle = (i / FRAMES) * Math.PI * 2
        scratch.position.set(Math.sin(angle) * RING.radius, RING.height + FRAME.height / 2 + cableLength / 2, Math.cos(angle) * RING.radius)
        scratch.rotation.set(0, angle, 0)
        scratch.translateX(side * (FRAME.width / 2 - 0.06))
        scratch.updateMatrix()
        cables.current?.setMatrixAt(i * 2 + (side + 1) / 2, scratch.matrix)
      }
    }
    if (frames.current) frames.current.instanceMatrix.needsUpdate = true
    if (cables.current) cables.current.instanceMatrix.needsUpdate = true
    pose(0)
  }, [cableLength])

  useRoomFrame(({ clock }) => {
    if (motion.reduced) return
    const t = clock.elapsedTime
    if (ring.current) ring.current.rotation.y = ((t / RING.turn) % 1) * Math.PI * 2
    pose(t)
  })

  return (
    <>
      <group ref={ring} position={[cx, 0, cz]}>
        <instancedMesh ref={frames} args={[frame, FIXTURE_MATERIAL, FRAMES]} frustumCulled={false} />
        <instancedMesh ref={cables} args={[undefined, FIXTURE_MATERIAL, FRAMES * 2]} frustumCulled={false}>
          <boxGeometry args={[0.006, cableLength, 0.006]} />
        </instancedMesh>
        {styles.map(({ geometry, material }, style) => (
          <instancedMesh key={style} ref={(mesh) => void (keys.current[style] = mesh)} args={[geometry, material, FRAMES / 4]} frustumCulled={false} />
        ))}
      </group>
      <Lectern />
    </>
  )
}

/** The installation's label, on a slim oak lectern facing the entrance. */
function Lectern() {
  const [x, z] = KEY_VISUAL.lectern
  useObstacle(KEY_VISUAL.id, box(x, z, LECTERN.width, LECTERN.depth))
  useFocusTarget({ id: KEY_VISUAL.id, position: [x, 1.3, z + 0.2], card: KEY_VISUAL, labelled: true })
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, LECTERN.height / 2, 0]} material={OAK_MATERIAL}>
        <boxGeometry args={[LECTERN.width, LECTERN.height, LECTERN.depth]} />
      </mesh>
      <ExhibitLabel position={[-LECTERN.width / 2 + 0.1, LECTERN.height - 0.1, LECTERN.depth / 2 + 0.004]} exhibit={KEY_VISUAL} width={LECTERN.width - 0.2} ink={INK} />
    </group>
  )
}
