import { useRef } from 'react'
import * as THREE from 'three'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, sincePress, type ArtifactProps } from './shared'

const SHEET = { width: 0.9, height: 0.3 }
const RIPPLE = 0.7

/**
 * 2014. A raised Material button on a light surface: a sheet of colour with a soft shadow.
 * A press lifts it (the shadow sharpens and spreads) and a ripple spreads from the touch.
 */
export function Material({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const sheet = useRef<THREE.Group>(null)
  const shadow = useRef<THREE.Mesh>(null)
  const shadowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const ripple = useRef<THREE.Mesh>(null)
  const rippleMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const lift = useRef(0)

  useRoomFrame(({ clock }, delta) => {
    const t = sincePress(pressedAt, clock.elapsedTime)
    const pressing = t >= 0 && t < 0.45
    lift.current = THREE.MathUtils.damp(lift.current, pressing ? 1 : 0, 14, delta)
    const k = lift.current
    if (sheet.current) sheet.current.position.z = 0.02 + 0.03 * k
    if (shadow.current) {
      shadow.current.position.y = -0.012 - 0.02 * k
      shadow.current.scale.set(1 + 0.04 * k, 1 + 0.15 * k, 1)
    }
    if (shadowMaterial.current) shadowMaterial.current.opacity = 0.16 + 0.12 * k
    const r = t >= 0 && t < RIPPLE ? t / RIPPLE : 1
    if (ripple.current) ripple.current.scale.setScalar(0.01 + (SHEET.width / 2) * Math.sqrt(r))
    if (rippleMaterial.current) rippleMaterial.current.opacity = 0.32 * (1 - r)
  })

  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.02]} />
        <meshBasicMaterial color="#fafafa" />
      </mesh>
      <mesh ref={shadow} position={[0, -0.012, 0.011]}>
        <planeGeometry args={[SHEET.width + 0.03, SHEET.height + 0.02]} />
        <meshBasicMaterial ref={shadowMaterial} color="#000000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <group ref={sheet} position={[0, 0, 0.02]}>
        <mesh>
          <planeGeometry args={[SHEET.width, SHEET.height]} />
          <meshBasicMaterial color="#2196f3" />
        </mesh>
        {/* Past the sheet's edge the white ripple meets the white surface and disappears: it needs no clipping. */}
        <mesh ref={ripple} position={[0, 0, 0.001]} scale={0.01}>
          <circleGeometry args={[1, 40]} />
          <meshBasicMaterial ref={rippleMaterial} color="#ffffff" transparent opacity={0} depthWrite={false} />
        </mesh>
        <Text position={[0, 0, 0.002]} fontSize={0.09} letterSpacing={0.08} color="#ffffff" anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    </group>
  )
}
