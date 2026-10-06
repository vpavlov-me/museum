import { useCallback, useEffect } from 'react'
import { activityOf, useActivity, useRoom } from '../museum/RoomContext'
import { museumStore } from '../museum/store'
import type { Vec3 } from './engine'
import { loadingLoop, SOUNDS, type SoundName } from './sounds'
import { playRecipe, startLoop } from './synth'

const LOOPS = { loading: loadingLoop }
export type LoopName = keyof typeof LOOPS

/**
 * Plays a museum sound from a room, at a room-local position (or in the head).
 * A room that cannot be seen makes no sound.
 */
export function useSound() {
  const { id, origin } = useRoom()
  return useCallback(
    (name: SoundName, at?: Vec3) => {
      if (activityOf(id, museumStore.get().spaceId) === 'inactive') return
      playRecipe(SOUNDS[name], at && [at[0] + origin[0], at[1], at[2] + origin[1]])
    },
    [id, origin],
  )
}

/**
 * A loop that sounds at a room-local position while `enabled` and while its room can
 * be seen; it fades out and is released as soon as either stops being true, so walking
 * in and out of a room never stacks copies.
 */
export function useSoundLoop(name: LoopName, at: Vec3, gain: number, enabled: boolean) {
  const { origin } = useRoom()
  const audible = useActivity() !== 'inactive'
  const [x, y, z] = at

  useEffect(() => {
    if (!enabled || !audible) return
    return startLoop(LOOPS[name], gain, [x + origin[0], y, z + origin[1]])
  }, [name, gain, enabled, audible, x, y, z, origin])
}
