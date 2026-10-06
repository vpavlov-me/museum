import { createContext, useContext, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type RenderCallback } from '@react-three/fiber'
import type * as THREE from 'three'
import { ARCHITECTURE_DEPTH, cellsVisible, NEIGHBOURS, spaceWithin } from './roomRegistry'
import { museumStore, useMuseumStore } from './store'
import type { SpaceDefinition, Vec2 } from './types'

type RoomContextValue = { id: string; origin: Vec2 }

const RoomContext = createContext<RoomContextValue>({ id: '', origin: [0, 0] })

/**
 * Places a room at its origin and lets its children register colliders and focus
 * targets in local space. The whole room, architecture included, is hidden while it is
 * too many doors away to be seen (see ARCHITECTURE_DEPTH).
 */
export function RoomGroup({ space, children }: { space: SpaceDefinition; children: ReactNode }) {
  const [x, z] = space.origin
  const value = useMemo(() => ({ id: space.id, origin: [x, z] as Vec2 }), [space.id, x, z])
  const group = useRef<THREE.Group>(null)
  const near = useMuseumStore((state) => spaceWithin(space.id, state.spaceId, state.cell, ARCHITECTURE_DEPTH))

  useLayoutEffect(() => {
    if (group.current) group.current.visible = near
  }, [near])

  return (
    <RoomContext.Provider value={value}>
      <group ref={group} position={[x, 0, z]}>
        {children}
      </group>
    </RoomContext.Provider>
  )
}

export const useRoom = () => useContext(RoomContext)

/*
 * Room activation. A space is `active` while the visitor stands in it, `nearby` while
 * they stand in a space that opens into it, and `inactive` otherwise: room-level state
 * (sound loops, resets) follows this. What is drawn and animated is finer, cell by cell
 * (RoomContents, useRoomFrame). Architecture is never hidden, so nothing pops in.
 */
export type Activity = 'active' | 'nearby' | 'inactive'

export const activityOf = (roomId: string, spaceId: string): Activity =>
  roomId === spaceId ? 'active' : NEIGHBOURS.get(spaceId)?.has(roomId) ? 'nearby' : 'inactive'

/** This room's activity; re-renders only when it changes. */
export function useActivity() {
  const { id } = useRoom()
  return useMuseumStore((state) => activityOf(id, state.spaceId))
}

/** The cells of its room a section of contents belongs to (undefined: the whole room). */
const CellsContext = createContext<readonly number[] | undefined>(undefined)

/** Whether a room's cells can be seen from where the visitor stands now. */
export function sectionVisible(roomId: string, cells: readonly number[] | undefined) {
  const { spaceId, cell } = museumStore.get()
  return cellsVisible(roomId, cells, spaceId, cell)
}

/** The cells of the section this component is in, for fixtures that register themselves. */
export const useSectionCells = () => useContext(CellsContext)

/** `useFrame` that sleeps while its section of the room cannot be seen. */
export function useRoomFrame(callback: RenderCallback) {
  const { id } = useRoom()
  const cells = useContext(CellsContext)
  useFrame((state, delta, frame) => {
    if (sectionVisible(id, cells)) callback(state, delta, frame)
  })
}

/**
 * Everything in a room except its merged architecture: exhibits, text, fixtures.
 * Drawn only where it can be seen, cell by cell: the visitor's cell and up to two
 * doors beyond it (see VIEW_DEPTH). Frustum culling cannot see through walls; this can,
 * and it is where most of the museum's draw calls (text in particular) used to go.
 * `cells` names the room cells a section stands in; without it, the whole room.
 */
export function RoomContents({ cells, children }: { cells?: readonly number[]; children: ReactNode }) {
  const { id } = useRoom()
  const group = useRef<THREE.Group>(null)
  const visible = useMuseumStore((state) => cellsVisible(id, cells, state.spaceId, state.cell))

  useLayoutEffect(() => {
    if (group.current) group.current.visible = visible
  }, [visible])

  return (
    <CellsContext.Provider value={cells}>
      <group ref={group}>{children}</group>
    </CellsContext.Provider>
  )
}
