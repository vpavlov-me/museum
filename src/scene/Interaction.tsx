import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRoom } from '../museum/RoomContext'
import { museumStore } from '../museum/store'
import type { ExhibitCardData } from '../museum/types'

/*
 * Proximity + gaze focus. Rooms register targets in local coordinates; every frame
 * the focus system picks the best target in the visitor's current room that is
 * close enough and roughly in front of them. If it has a prompt, pressing E calls
 * `onInteract`. No precision clicking is ever required.
 *
 * Its card is always announced to assistive technology, but only shown on screen
 * when the object has no physical label of its own (`labelled`).
 */

export type FocusTargetSpec = {
  id: string
  /** Room-local point the visitor needs to approach and look towards. */
  position: [number, number, number]
  /** Maximum floor distance, metres. */
  distance?: number
  /** Minimum cosine between the horizontal view direction and the target. */
  facing?: number
  card?: ExhibitCardData | null
  /** The object carries its own label in the space, so the card stays off screen. */
  labelled?: boolean
  /** Verb next to the E key. `null` disables interaction while keeping the card. */
  prompt?: string | null
  onInteract?: () => void
}

type RegisteredTarget = {
  roomId: string
  origin: [number, number]
  spec: { current: FocusTargetSpec }
}

const targets = new Set<RegisteredTarget>()

const DEFAULT_DISTANCE = 3.2
const DEFAULT_FACING = 0.5

export function useFocusTarget(spec: FocusTargetSpec) {
  const { id: roomId, origin } = useRoom()
  const specRef = useRef(spec)
  specRef.current = spec

  useEffect(() => {
    const entry: RegisteredTarget = { roomId, origin, spec: specRef }
    targets.add(entry)
    return () => {
      targets.delete(entry)
    }
  }, [roomId, origin])
}

export function FocusSystem({ active }: { active: boolean }) {
  const look = useRef(new THREE.Vector3())
  const focused = useRef<RegisteredTarget | null>(null)

  useFrame(({ camera }) => {
    if (!active) return

    camera.getWorldDirection(look.current)
    look.current.y = 0
    look.current.normalize()

    const { spaceId, focus } = museumStore.get()
    let best: RegisteredTarget | null = null
    let bestScore = Number.POSITIVE_INFINITY

    for (const target of targets) {
      if (target.roomId !== spaceId) continue
      const spec = target.spec.current
      // Nothing to say and nothing to do: not worth focusing.
      if (!spec.card && !(spec.onInteract && spec.prompt)) continue
      const dx = spec.position[0] + target.origin[0] - camera.position.x
      const dz = spec.position[2] + target.origin[1] - camera.position.z
      const distance = Math.hypot(dx, dz)
      if (distance > (spec.distance ?? DEFAULT_DISTANCE)) continue
      // Never pick something behind or beside the visitor.
      const facing = distance > 0.001 ? (dx * look.current.x + dz * look.current.z) / distance : 1
      if (facing < (spec.facing ?? DEFAULT_FACING)) continue
      // Prefer what is near and centred in view.
      const score = distance * (1.6 - facing)
      if (score < bestScore) {
        best = target
        bestScore = score
      }
    }

    focused.current = best
    const spec = best?.spec.current
    const prompt = spec?.onInteract ? (spec.prompt ?? null) : null
    const card = spec?.card ?? null
    const labelled = spec?.labelled ?? false
    if (focus?.id !== spec?.id || focus?.prompt !== prompt || focus?.card !== card || focus?.labelled !== labelled) {
      museumStore.set({ focus: spec ? { id: spec.id, card, labelled, prompt } : null })
    }
  })

  useEffect(() => {
    if (!active) {
      focused.current = null
      museumStore.set({ focus: null })
      return
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat) return
      const spec = focused.current?.spec.current
      if (spec?.onInteract && spec.prompt) spec.onInteract()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])

  return null
}
