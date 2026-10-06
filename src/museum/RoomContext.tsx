import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type RenderCallback } from '@react-three/fiber'
import type * as THREE from 'three'
import { NEIGHBOURS } from './roomRegistry'
import { museumStore, useMuseumStore } from './store'
import type { SpaceDefinition, Vec2 } from './types'

type RoomContextValue = { id: string; origin: Vec2 }

const RoomContext = createContext<RoomContextValue>({ id: '', origin: [0, 0] })

/** Places a room at its origin and lets its children register colliders and focus targets in local space. */
export function RoomGroup({ space, children }: { space: SpaceDefinition; children: ReactNode }) {
  const [x, z] = space.origin
  const value = useMemo(() => ({ id: space.id, origin: [x, z] as Vec2 }), [space.id, x, z])

  return (
    <RoomContext.Provider value={value}>
      <group position={[x, 0, z]}>{children}</group>
    </RoomContext.Provider>
  )
}

export const useRoom = () => useContext(RoomContext)

/*
 * Room activation. A space is `active` while the visitor stands in it, `nearby` while
 * they stand in a space that opens into it (so it can be seen through a door), and
 * `inactive` otherwise. Spaces are only ever seen through their doors, so an inactive
 * room cannot be seen at all: its contents are hidden, its animations paused and its
 * realtime lights handed to rooms that can be seen. Architecture is never hidden, so
 * nothing pops in at a doorway.
 */
export type Activity = 'active' | 'nearby' | 'inactive'

export const activityOf = (roomId: string, spaceId: string): Activity =>
  roomId === spaceId ? 'active' : NEIGHBOURS.get(spaceId)?.has(roomId) ? 'nearby' : 'inactive'

/** This room's activity; re-renders only when it changes. */
export function useActivity() {
  const { id } = useRoom()
  return useMuseumStore((state) => activityOf(id, state.spaceId))
}

/** `useFrame` that sleeps while its room cannot be seen. */
export function useRoomFrame(callback: RenderCallback) {
  const { id } = useRoom()
  useFrame((state, delta, frame) => {
    if (activityOf(id, museumStore.get().spaceId) !== 'inactive') callback(state, delta, frame)
  })
}

/**
 * Everything in a room except its merged architecture: exhibits, text, fixtures.
 * Hidden while the room is inactive, which is where most of the museum's draw calls
 * (text in particular) used to go: frustum culling cannot see through walls, this can.
 */
export function RoomContents({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  const visible = useActivity() !== 'inactive'

  useLayoutEffect(() => {
    if (group.current) group.current.visible = visible
  }, [visible])

  return <group ref={group}>{children}</group>
}
