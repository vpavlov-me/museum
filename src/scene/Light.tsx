import { useMemo } from 'react'
import * as THREE from 'three'
import { CIRCLE } from './geometry'
import { poolMaterial, type Palette } from './materials'

const DOWN: [number, number, number] = [-Math.PI / 2, 0, 0]
const UP: [number, number, number] = [Math.PI / 2, 0, 0]

/**
 * A recessed ceiling spotlight aimed at a point: the museum's only kind of realtime
 * light. Its cone keeps the light where it is meant to be and out of the next room.
 */
export function Downlight({
  at,
  aim,
  ceiling,
  palette,
  angle = 0.45,
  penumbra = 0.7,
  intensity = 40,
  distance = 10,
  color = '#f2e9d8',
}: {
  /** [x, z] of the fixture. */
  at: [number, number]
  /** Point the cone is aimed at. */
  aim: [number, number, number]
  ceiling: number
  palette: Palette
  angle?: number
  penumbra?: number
  intensity?: number
  distance?: number
  color?: string
}) {
  const target = useMemo(() => new THREE.Object3D(), [])

  return (
    <>
      <spotLight
        position={[at[0], ceiling - 0.05, at[1]]}
        target={target}
        angle={angle}
        penumbra={penumbra}
        intensity={intensity}
        distance={distance}
        decay={2}
        color={color}
      />
      <primitive object={target} position={aim} />
      <mesh position={[at[0], ceiling - 0.004, at[1]]} rotation={UP} geometry={CIRCLE} scale={0.09} material={palette.glow} />
    </>
  )
}

/** A painted pool of light on the floor (or any surface): no realtime cost beyond one quad. */
export function LightPool({
  position,
  size,
  color = '#f2e9d8',
  strength = 0.25,
  rotation = DOWN,
}: {
  position: [number, number, number]
  size: [number, number]
  color?: string
  strength?: number
  rotation?: [number, number, number]
}) {
  return (
    <mesh position={position} rotation={rotation} material={poolMaterial(color, strength)} renderOrder={1}>
      <planeGeometry args={size} />
    </mesh>
  )
}

/** A luminous recess in the ceiling: a light source you can see, which never lights anything. */
export function Luminaire({ position, size, palette }: { position: [number, number, number]; size: [number, number]; palette: Palette }) {
  return (
    <mesh position={position} rotation={UP} material={palette.glow}>
      <planeGeometry args={size} />
    </mesh>
  )
}
