import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { museumStore } from '../museum/store'
import { ambience } from './ambience'
import { sound, type Presence } from './engine'

/**
 * Keeps the sound in step with the visit: the listener follows the camera, the room
 * tone follows the space (and the state within it), and the level follows presence:
 * walking, paused, or gone. `M` toggles sound at any time.
 */
export function AudioDirector({ presence }: { presence: Presence }) {
  const forward = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => sound.setPresence(presence), [presence])

  useEffect(() => {
    const follow = () => {
      const { spaceId, zoneId } = museumStore.get()
      ambience.setPlace(zoneId ? `${spaceId}:${zoneId}` : spaceId)
    }
    follow()
    return museumStore.subscribe(follow)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'KeyM' && !event.repeat) sound.toggleMuted()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useFrame(({ camera }) => {
    const listener = sound.context?.listener
    if (!listener || !listener.positionX) return
    camera.getWorldDirection(forward)
    listener.positionX.value = camera.position.x
    listener.positionY.value = camera.position.y
    listener.positionZ.value = camera.position.z
    listener.forwardX.value = forward.x
    listener.forwardY.value = forward.y
    listener.forwardZ.value = forward.z
    listener.upX.value = 0
    listener.upY.value = 1
    listener.upZ.value = 0
  })

  return null
}
