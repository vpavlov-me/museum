import { createContext, useContext, useMemo, type ReactNode } from 'react'
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
