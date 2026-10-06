import { useSyncExternalStore } from 'react'

/*
 * What this device can do, used only to choose how to visit (no fingerprinting,
 * nothing stored or sent anywhere):
 *
 *   walk    — a fine pointer that can hover, and pointer lock: the full first-person visit.
 *   guided  — WebGL, but touch or no pointer lock: an authored tour through the same rooms.
 *   text    — no WebGL: the exhibition as a page of text.
 *
 * Visitors can always choose the guided tour or the text instead.
 */

export type VisitMode = 'walk' | 'guided' | 'text'

const media = (query: string) => typeof window !== 'undefined' && window.matchMedia?.(query).matches

function canUseWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    const ok = context !== null
    ;(context as WebGLRenderingContext | null)?.getExtension('WEBGL_lose_context')?.loseContext()
    return ok
  } catch {
    return false
  }
}

export function detectCapabilities() {
  const webgl = canUseWebGL()
  const finePointer = Boolean(media('(pointer: fine)') && media('(hover: hover)'))
  const pointerLock = typeof Element !== 'undefined' && 'requestPointerLock' in Element.prototype
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0
  const recommended: VisitMode = !webgl ? 'text' : finePointer && pointerLock ? 'walk' : 'guided'
  return { webgl, finePointer, pointerLock, touch, recommended }
}

export type Capabilities = ReturnType<typeof detectCapabilities>

const reducedQuery = typeof window !== 'undefined' ? window.matchMedia?.('(prefers-reduced-motion: reduce)') : undefined
let reduced = Boolean(reducedQuery?.matches)
const motionListeners = new Set<() => void>()
reducedQuery?.addEventListener('change', (event) => {
  reduced = event.matches
  motionListeners.forEach((listener) => listener())
})

/** Read every frame by animations that sweep or shimmer: when the visitor prefers less motion, they settle instead. */
export const motion = {
  get reduced() {
    return reduced
  },
}

export function useReducedMotion() {
  return useSyncExternalStore(
    (onChange) => {
      motionListeners.add(onChange)
      return () => {
        motionListeners.delete(onChange)
      }
    },
    () => reduced,
  )
}
