import { useLayoutEffect, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Renders its children once, then draws every plain mesh inside them as one merged
 * mesh per shared material. Architecture is authored as readable JSX (walls, reveals,
 * skirting, luminous slots) but costs a few draw calls per room instead of dozens.
 *
 * Only for things that never move. Text and meshes with array materials are left alone.
 */
export function StaticMerge({ children }: { children: ReactNode }) {
  const source = useRef<THREE.Group>(null)
  const output = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    const root = source.current
    const target = output.current
    if (!root || !target) return

    root.updateWorldMatrix(true, true)
    const toRoot = root.matrixWorld.clone().invert()
    const buckets = new Map<THREE.Material, { meshes: THREE.Mesh[]; geometries: THREE.BufferGeometry[] }>()

    root.traverse((object) => {
      const mesh = object as THREE.Mesh
      if (!mesh.isMesh || Array.isArray(mesh.material) || !mesh.geometry.index) return
      if ((mesh.geometry as THREE.InstancedBufferGeometry).isInstancedBufferGeometry) return
      const geometry = mesh.geometry.clone()
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld))
      const bucket = buckets.get(mesh.material) ?? { meshes: [], geometries: [] }
      bucket.meshes.push(mesh)
      bucket.geometries.push(geometry)
      buckets.set(mesh.material, bucket)
    })

    const merged: THREE.Mesh[] = []
    const hidden: THREE.Mesh[] = []
    buckets.forEach(({ meshes, geometries }, material) => {
      const geometry = meshes.length > 1 ? mergeGeometries(geometries, false) : null
      geometries.forEach((g) => g.dispose())
      if (!geometry) return
      const mesh = new THREE.Mesh(geometry, material)
      mesh.matrixAutoUpdate = false
      merged.push(mesh)
      meshes.forEach((m) => {
        m.visible = false
        hidden.push(m)
      })
    })
    merged.forEach((mesh) => target.add(mesh))

    return () => {
      merged.forEach((mesh) => {
        target.remove(mesh)
        mesh.geometry.dispose()
      })
      hidden.forEach((m) => {
        m.visible = true
      })
    }
  })

  return (
    <>
      <group ref={source}>{children}</group>
      <group ref={output} />
    </>
  )
}
