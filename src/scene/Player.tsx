import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { navigation } from '../museum/navigation'
import { EYE_HEIGHT } from '../museum/roomRegistry'
import { trackVisitor } from '../museum/store'
import { moveWithCollision } from './Collision'

export const PLAYER_RADIUS = 0.45
const WALK_SPEED = 2.2

/** First-person walking: WASD relative to the view, eased, at exhibition pace. */
export function Player({ active }: { active: boolean }) {
  const camera = useThree((state) => state.camera)
  const keys = useRef<Record<string, boolean>>({})
  const velocity = useRef(new THREE.Vector3())
  const forward = useRef(new THREE.Vector3())
  const right = useRef(new THREE.Vector3())
  const wish = useRef(new THREE.Vector3())

  useEffect(() => {
    const onDown = (event: KeyboardEvent) => {
      keys.current[event.code] = true
    }
    const onUp = (event: KeyboardEvent) => {
      keys.current[event.code] = false
    }
    const reset = () => {
      keys.current = {}
    }

    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', reset)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', reset)
    }
  }, [])

  // Every visit starts in the lobby by the front door (or where a direct link points).
  useEffect(() => {
    const { x, z, yaw } = navigation.start()
    camera.position.set(x, EYE_HEIGHT, z)
    camera.rotation.set(0, yaw, 0, 'YXZ')
    trackVisitor(x, z)
  }, [camera])

  useEffect(() => {
    if (!active) {
      keys.current = {}
      velocity.current.set(0, 0, 0)
    }
  }, [active])

  useFrame(({ camera }, rawDelta) => {
    // Back to the lobby from an exhibition's last door: placed, not walked.
    const move = navigation.takeMove()
    if (move) {
      camera.position.set(move.x, EYE_HEIGHT, move.z)
      camera.rotation.set(0, move.yaw, 0, 'YXZ')
      velocity.current.set(0, 0, 0)
      trackVisitor(move.x, move.z)
    }
    if (!active) return
    const delta = Math.min(rawDelta, 0.1)

    camera.getWorldDirection(forward.current)
    forward.current.y = 0
    forward.current.normalize()
    right.current.crossVectors(forward.current, camera.up).normalize()

    const k = keys.current
    wish.current.set(0, 0, 0)
    if (k.KeyW) wish.current.add(forward.current)
    if (k.KeyS) wish.current.sub(forward.current)
    if (k.KeyD) wish.current.add(right.current)
    if (k.KeyA) wish.current.sub(right.current)
    if (wish.current.lengthSq() > 0) wish.current.normalize().multiplyScalar(WALK_SPEED)

    // Ease in and out of walking instead of starting and stopping instantly.
    velocity.current.lerp(wish.current, 1 - Math.exp(-8 * delta))

    const v = velocity.current
    const { blockedX, blockedZ } = moveWithCollision(camera.position, v.x * delta, v.z * delta, PLAYER_RADIUS)
    if (blockedX) v.x = 0
    if (blockedZ) v.z = 0
    camera.position.y = EYE_HEIGHT

    // The active room is wherever the visitor is physically standing.
    trackVisitor(camera.position.x, camera.position.z)
  })

  return null
}
