import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { spaceAt } from '../museum/roomRegistry'
import { museumStore } from '../museum/store'
import { moveWithCollision } from './Collision'
import { PLAYER_RADIUS } from './Player'

declare global {
  interface Window {
    __museum?: Record<string, unknown>
  }
}

/**
 * Development only: exposes the camera and state so a walkthrough can be scripted
 * in environments without Pointer Lock (automated browsers, embedded previews).
 * `walkTo` uses the same collision path as the player, independent of frame rate.
 */
export function DebugBridge({ setLocked }: { setLocked: (locked: boolean) => void }) {
  const camera = useThree((state) => state.camera)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const walkTo = (x: number, z: number) => {
      const p = camera.position
      for (let i = 0; i < 4000; i++) {
        const dx = x - p.x
        const dz = z - p.z
        const d = Math.hypot(dx, dz)
        if (d < 0.02) break
        const s = Math.min(0.04, d)
        const before = p.clone()
        moveWithCollision(p, (dx / d) * s, (dz / d) * s, PLAYER_RADIUS)
        const space = spaceAt(p.x, p.z)
        if (space && space.id !== museumStore.get().spaceId) museumStore.set({ spaceId: space.id })
        if (before.distanceTo(p) < 1e-4) break
      }
      return { x: +p.x.toFixed(2), z: +p.z.toFixed(2), space: museumStore.get().spaceId }
    }

    window.__museum = { camera, scene, store: museumStore, setLocked, walkTo }
    return () => {
      delete window.__museum
    }
  }, [camera, scene, setLocked])

  return null
}
