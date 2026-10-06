import { Fragment, Suspense, useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import type * as THREE from 'three'
import { AudioDirector } from '../audio/AudioDirector'
import type { Presence } from '../audio/engine'
import { exhibitions, useExhibitionStatuses } from '../museum/exhibitionLoader'
import { OPEN_EXHIBITIONS, type ExhibitionDefinition } from '../museum/exhibitions'
import { getSpace } from '../museum/roomRegistry'
import { restoreHidden, RoomGroup } from '../museum/RoomContext'
import { Lobby } from '../rooms/lobby/Lobby'
import { Controls } from './Controls'
import { DebugBridge } from './DebugBridge'
import { GuidedTour } from './GuidedTour'
import { FocusSystem } from './Interaction'
import { LightRig } from './Light'
import { Lighting } from './Lighting'
import { PerfReadout } from './PerfReadout'
import { Player } from './Player'

/** Development tooling: in dev, and in the `profile` build (a production build to measure); never in production. */
const TOOLS = import.meta.env.DEV || import.meta.env.MODE === 'profile'

/** Compiles a wing's shaders once it has mounted, then lets its door open. */
function CompileWing({ id, wing }: { id: ExhibitionDefinition['id']; wing: React.RefObject<THREE.Group | null> }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    const root = wing.current
    if (!root) return
    let cancelled = false
    // Out-of-sight contents are hidden; show them for the compile only (see Precompile).
    const hidden: THREE.Object3D[] = []
    root.traverse((object) => {
      if (!object.visible) {
        hidden.push(object)
        object.visible = true
      }
    })
    const compiled = gl.extensions.has('KHR_parallel_shader_compile') ? gl.compileAsync(root, camera, scene) : Promise.resolve(gl.compile(root, camera, scene))
    compiled
      .catch(() => undefined)
      .finally(() => {
        restoreHidden(hidden)
        if (!cancelled) exhibitions.opened(id)
      })
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera, id, wing])

  return null
}

/** An exhibition's rooms, once its chunk has arrived. */
function Wing({ exhibition }: { exhibition: ExhibitionDefinition }) {
  const rooms = exhibitions.rooms(exhibition.id)
  const wing = useRef<THREE.Group>(null)
  if (!rooms) return null
  return (
    <Suspense fallback={null}>
      <group ref={wing}>
        {exhibition.spaces.map((id) => {
          const space = getSpace(id)
          const Room = rooms[id]
          if (!space || !Room) return null
          return (
            <RoomGroup key={id} space={space}>
              <Room />
            </RoomGroup>
          )
        })}
      </group>
      <CompileWing id={exhibition.id} wing={wing} />
    </Suspense>
  )
}

/**
 * The whole museum: the lobby, always, and each exhibition once it has been asked for
 * (see museum/exhibitionLoader). `visit` counts visits: starting another remounts the
 * rooms and the visitor (every room back to its first state, the visitor back at the
 * start), while the controls, lights and focus system carry on.
 */
export function MuseumWorld({
  visit,
  mode,
  active,
  presence,
  onLockChange,
}: {
  visit: number
  /** Walking (WASD, mouse look, pointer lock) or the guided tour (authored stops, drag to look). */
  mode: 'walk' | 'guided'
  active: boolean
  presence: Presence
  onLockChange: (locked: boolean) => void
}) {
  const statuses = useExhibitionStatuses()
  return (
    <>
      <Lighting />
      <LightRig />

      <Fragment key={visit}>
        <RoomGroup space={getSpace('lobby')!}>
          <Lobby />
        </RoomGroup>
        {OPEN_EXHIBITIONS.map((exhibition) => statuses[exhibition.id] && statuses[exhibition.id] !== 'loading' && <Wing key={exhibition.id} exhibition={exhibition} />)}
        {mode === 'walk' ? <Player active={active} /> : <GuidedTour />}
      </Fragment>
      <FocusSystem active={active} />
      <AudioDirector presence={presence} />
      {mode === 'walk' && <Controls onLockChange={onLockChange} />}
      {TOOLS && <DebugBridge setLocked={onLockChange} />}
      {TOOLS && <PerfReadout />}
    </>
  )
}
