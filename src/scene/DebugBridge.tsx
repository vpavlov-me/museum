import { useEffect } from 'react'
import { advance, useThree } from '@react-three/fiber'
import { sound } from '../audio/engine'
import { exhibitions } from '../museum/exhibitionLoader'
import { museumStore, trackVisitor } from '../museum/store'
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
  const gl = useThree((state) => state.gl)

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
        trackVisitor(p.x, p.z)
        if (before.distanceTo(p) < 1e-4) break
      }
      return { x: +p.x.toFixed(2), z: +p.z.toFixed(2), space: museumStore.get().spaceId }
    }

    /** Places the visitor without walking (no collision), facing yaw / pitch. */
    const teleport = (x: number, z: number, yaw = 0, pitch = 0) => {
      camera.position.set(x, camera.position.y, z)
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
      trackVisitor(x, z)
      return museumStore.get().spaceId
    }

    /** Turn the view: yaw 0 looks north (-z), positive yaw turns left; pitch in radians. */
    const look = (yaw: number, pitch = 0) => {
      camera.rotation.set(pitch, yaw, 0, 'YXZ')
    }

    /** Renders a frame now and returns the sRGB colour at a point of the canvas, in CSS pixels. */
    const sample = (x: number, y: number) => {
      gl.render(scene, camera)
      const ratio = gl.getPixelRatio()
      const pixel = new Uint8Array(4)
      const context = gl.getContext()
      context.readPixels(Math.round(x * ratio), Math.round(context.drawingBufferHeight - y * ratio), 1, 1, context.RGBA, context.UNSIGNED_BYTE, pixel)
      return Array.from(pixel.slice(0, 3))
    }

    /** Runs `frames` frames by hand: frame callbacks and a render, even while the page is hidden. */
    let clock = performance.now()
    const step = (frames = 1) => {
      for (let i = 0; i < frames; i++) advance((clock += 1000 / 60), true)
    }

    window.__museum = { camera, scene, gl, store: museumStore, sound, exhibitions, setLocked, walkTo, teleport, look, sample, step }
    return () => {
      delete window.__museum
    }
  }, [camera, scene, gl, setLocked])

  return null
}
