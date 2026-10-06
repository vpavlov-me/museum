import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { activityOf, useRoom } from '../museum/RoomContext'
import { museumStore } from '../museum/store'
import { CIRCLE } from './geometry'
import { poolMaterial, type Palette } from './materials'

const DOWN: [number, number, number] = [-Math.PI / 2, 0, 0]
const UP: [number, number, number] = [Math.PI / 2, 0, 0]

type DownlightSpec = {
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
}

type Fixture = { roomId: string; origin: [number, number]; spec: { current: DownlightSpec } }

const fixtures = new Set<Fixture>()

/**
 * A recessed ceiling spotlight aimed at a point: the museum's only kind of realtime
 * light. Its cone keeps the light where it is meant to be and out of the next room.
 * The fixture itself is just a disc; the light comes from the shared rig (LightRig),
 * which lights it whenever its room can be seen. Props may change at runtime.
 */
export function Downlight(spec: DownlightSpec) {
  const { id: roomId, origin } = useRoom()
  const specRef = useRef(spec)
  specRef.current = spec

  useEffect(() => {
    const fixture: Fixture = { roomId, origin, spec: specRef }
    fixtures.add(fixture)
    return () => {
      fixtures.delete(fixture)
    }
  }, [roomId, origin])

  const { at, ceiling, palette } = spec
  return <mesh position={[at[0], ceiling - 0.004, at[1]]} rotation={UP} geometry={CIRCLE} scale={0.09} material={palette.glow} />
}

/**
 * Realtime light budget: this many spotlights exist, ever. Changing the number of
 * lights in a scene recompiles every lit shader (a visible hitch at a doorway), so
 * instead the rig keeps a fixed pool and hands it to the fixtures of the rooms that
 * can be seen: the visitor's room first, then the rooms that open into it, nearest first.
 */
export const LIGHT_BUDGET = 6
// Seconds between re-ranking fixtures; lights cross-fade over roughly this long.
const RANK_EVERY = 0.25
const FADE = 7

type Slot = { light: THREE.SpotLight; fixture: Fixture | null; level: number }

export function LightRig() {
  const slots = useMemo<Slot[]>(
    () =>
      Array.from({ length: LIGHT_BUDGET }, () => {
        const light = new THREE.SpotLight('#ffffff', 0, 10, 0.45, 0.7, 2)
        return { light, fixture: null, level: 0 }
      }),
    [],
  )
  const wanted = useRef(new Set<Fixture>())
  const rankedAt = useRef(-Infinity)

  useEffect(() => () => slots.forEach(({ light }) => light.dispose()), [slots])

  useFrame(({ camera, clock }, delta) => {
    if (clock.elapsedTime - rankedAt.current > RANK_EVERY) {
      rankedAt.current = clock.elapsedTime
      const { spaceId } = museumStore.get()
      const ranked = [...fixtures]
        .map((fixture) => {
          const activity = activityOf(fixture.roomId, spaceId)
          const [x, z] = fixture.spec.current.at
          const distance = Math.hypot(x + fixture.origin[0] - camera.position.x, z + fixture.origin[1] - camera.position.z)
          return { fixture, activity, distance }
        })
        .filter(({ activity }) => activity !== 'inactive')
        .sort((a, b) => (a.activity === b.activity ? a.distance - b.distance : a.activity === 'active' ? -1 : 1))
      wanted.current = new Set(ranked.slice(0, LIGHT_BUDGET).map(({ fixture }) => fixture))
    }

    const assigned = new Set(slots.map((slot) => slot.fixture))
    for (const slot of slots) {
      // A light leaving its fixture fades out first, then moves to the next one and fades in.
      if (slot.fixture && !wanted.current.has(slot.fixture) && slot.level < 0.01) slot.fixture = null
      if (!slot.fixture) {
        const next = [...wanted.current].find((fixture) => !assigned.has(fixture))
        if (!next) continue
        slot.fixture = next
        slot.level = 0
        assigned.add(next)
      }

      slot.level = THREE.MathUtils.damp(slot.level, wanted.current.has(slot.fixture) ? 1 : 0, FADE, delta)
      const { at, aim, ceiling, angle = 0.45, penumbra = 0.7, intensity = 40, distance = 10, color = '#f2e9d8' } = slot.fixture.spec.current
      const [ox, oz] = slot.fixture.origin
      const { light } = slot
      light.position.set(at[0] + ox, ceiling - 0.05, at[1] + oz)
      light.target.position.set(aim[0] + ox, aim[1], aim[2] + oz)
      light.angle = angle
      light.penumbra = penumbra
      light.distance = distance
      light.color.set(color)
      light.intensity = intensity * slot.level
    }
    for (const slot of slots) if (!slot.fixture) slot.light.intensity = 0
  })

  return (
    <>
      {slots.map(({ light }) => (
        <group key={light.uuid}>
          <primitive object={light} />
          <primitive object={light.target} />
        </group>
      ))}
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
  material,
}: {
  position: [number, number, number]
  size: [number, number]
  color?: string
  strength?: number
  rotation?: [number, number, number]
  /** A pool material of its own, for light that changes (see `createPoolMaterial`). */
  material?: THREE.Material
}) {
  return (
    // A wash on a wall is drawn before the text hung on it, so the glyphs do not cut holes in the light.
    <mesh position={position} rotation={rotation} material={material ?? poolMaterial(color, strength)} renderOrder={rotation === DOWN ? 1 : -1}>
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
