import { useRef } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { BUTTON, sincePress, type ArtifactProps } from './shared'

const SURFACE = new THREE.Color('#1c1c1b')
const SURFACE_ACTIVE = new THREE.Color('#252524')
const LINE = new THREE.Color('#8f8c85')
const LINE_ACTIVE = new THREE.Color('#efede6')
const DURATION = 0.9

/**
 * 2026. The container nearly dissolves into the plinth; only the word and a hairline remain.
 * The response is a micro-interaction: the hairline extends, the arrow nudges forward, the surface warms.
 */
export function QuietButton({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const d = 0.012

  const surface = useRef<THREE.MeshStandardMaterial>(null)
  const line = useRef<THREE.Mesh>(null)
  const lineMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const arrow = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    const p = t >= 0 && t < DURATION ? t / DURATION : 0
    // Ease out on the way forward, settle back gently.
    const e = p > 0 ? Math.sin(Math.PI * Math.pow(p, 0.6)) : 0
    if (line.current) line.current.scale.x = 1 + 0.55 * e
    lineMaterial.current?.color.lerpColors(LINE, LINE_ACTIVE, e)
    surface.current?.color.lerpColors(SURFACE, SURFACE_ACTIVE, e)
    if (arrow.current) arrow.current.position.x = 0.36 + 0.07 * e
  })

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, d]} />
        <meshStandardMaterial ref={surface} color={SURFACE} roughness={0.9} />
      </mesh>
      <Text position={[0.26, 0.02, d / 2 + 0.002]} fontSize={0.17} letterSpacing={-0.01} color="#efede6" anchorX="right" anchorY="middle">
        {label}
      </Text>
      <Text ref={arrow} position={[0.36, 0.02, d / 2 + 0.002]} fontSize={0.17} color="#efede6" anchorX="left" anchorY="middle">
        →
      </Text>
      <mesh ref={line} position={[0, -0.12, d / 2 + 0.002]}>
        <planeGeometry args={[0.92, 0.006]} />
        <meshBasicMaterial ref={lineMaterial} color={LINE} />
      </mesh>
    </group>
  )
}
