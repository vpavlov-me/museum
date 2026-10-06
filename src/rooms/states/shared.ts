import * as THREE from 'three'
import { useRoom } from '../../museum/RoomContext'
import { museumStore, useMuseumStore } from '../../museum/store'

export { smoothstep } from '../accepted/shared'

/** The state (zone) of Room 03 the visitor is standing in, or null outside the room. */
export function useStateZone() {
  const { id } = useRoom()
  return useMuseumStore((state) => (state.spaceId === id ? state.zoneId : null))
}

/** Same, read without subscribing, for use inside frame callbacks. */
export const stateZoneNow = (roomId: string) => {
  const { spaceId, zoneId } = museumStore.get()
  return spaceId === roomId ? zoneId : null
}

export const damp = THREE.MathUtils.damp
