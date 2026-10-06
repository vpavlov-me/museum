import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import type * as THREE from 'three'

/**
 * Compiles every shader the museum will need before the door opens. Otherwise each
 * room compiles its programs the first time it comes into view, and the visitor feels
 * a stall at the threshold of a new room. Hidden contents (out-of-sight rooms, modals
 * not yet shown) are made visible for the compile only, then put back exactly as they were.
 */
export function Precompile({ onDone }: { onDone: () => void }) {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const camera = useThree((state) => state.camera)

  useEffect(() => {
    let cancelled = false
    const hidden: THREE.Object3D[] = []
    scene.traverse((object) => {
      if (!object.visible) {
        hidden.push(object)
        object.visible = true
      }
    })
    const restore = () => hidden.forEach((object) => (object.visible = false))
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .finally(() => {
        restore()
        if (!cancelled) onDone()
      })
    return () => {
      cancelled = true
    }
  }, [gl, scene, camera, onDone])

  return null
}
