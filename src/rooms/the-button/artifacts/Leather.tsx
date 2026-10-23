import { useLayoutEffect, useRef } from 'react'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, held, type ArtifactProps } from './shared'

const STITCH = { length: 0.03, gap: 0.022, inset: 0.05 }
const KEY = { width: 0.62, height: 0.24 }

/** Stitch positions round the leather, inset from its edge: [x, y, along x]. */
function stitches(width: number, height: number) {
  const step = STITCH.length + STITCH.gap
  const w = width - 2 * STITCH.inset
  const h = height - 2 * STITCH.inset
  const out: [number, number, boolean][] = []
  for (let x = -w / 2 + step / 2; x < w / 2; x += step) out.push([x, h / 2, true], [x, -h / 2, true])
  for (let y = -h / 2 + step / 2; y < h / 2; y += step) out.push([-w / 2, y, false], [w / 2, y, false])
  return out
}

/**
 * 2011. A calendar's leather header with its stitching, and a button of brushed metal set
 * into it, its word stamped with a white line beneath. A press sinks it into the hide.
 */
export function Leather({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const thread = useRef<THREE.InstancedMesh>(null)
  const key = useRef<THREE.Group>(null)
  const points = stitches(width, height)

  useLayoutEffect(() => {
    const mesh = thread.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    points.forEach(([x, y, alongX], i) => {
      m.makeRotationZ(alongX ? 0 : Math.PI / 2).setPosition(x, y, 0.021)
      mesh.setMatrixAt(i, m)
    })
    mesh.instanceMatrix.needsUpdate = true
  }, [points])

  useRoomFrame(({ clock }) => {
    if (key.current) key.current.position.z = 0.045 - 0.018 * held(pressedAt, clock.elapsedTime, 0.22)
  })

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.04]} />
        <meshStandardMaterial color="#5b3a24" roughness={0.82} />
      </mesh>
      <instancedMesh ref={thread} args={[undefined, undefined, points.length]}>
        <planeGeometry args={[STITCH.length, 0.008]} />
        <meshStandardMaterial color="#d8c6a2" roughness={0.9} />
      </instancedMesh>
      <group ref={key} position={[0.45, 0, 0.045]}>
        <RoundedBox args={[KEY.width, KEY.height, 0.05]} radius={0.02}>
          <meshStandardMaterial color="#bdbab3" metalness={0.7} roughness={0.34} />
        </RoundedBox>
        <Text position={[0, -0.006, 0.026]} fontSize={0.1} color="#ffffff" anchorX="center" anchorY="middle">
          {label}
        </Text>
        <Text position={[0, 0, 0.027]} fontSize={0.1} color="#2b2a28" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
      <Text position={[-0.45, 0, 0.022]} fontSize={0.1} color="#e9dcc3" anchorX="center" anchorY="middle">
        Calendars
      </Text>
    </group>
  )
}
