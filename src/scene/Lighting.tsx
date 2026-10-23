import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { setEnvironment } from './materials'

/**
 * What polished surfaces reflect: a light gallery under a ceiling of laylights, like
 * v3's lobby and hall (#48). Polished concrete then shows soft, pale walls and the
 * glow of the ceiling, not a dark room.
 */
function galleryEnvironment() {
  const scene = new THREE.Scene()
  const shell = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#a8a39a'), side: THREE.BackSide }))
  shell.position.y = 3.5
  scene.add(shell)
  const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fffaf0').multiplyScalar(2.2), side: THREE.DoubleSide })
  const geometry = new THREE.PlaneGeometry(2.4, 2.4)
  for (const x of [-7.2, -3.6, 0, 3.6, 7.2]) {
    for (const z of [-7.2, -3.6, 0, 3.6, 7.2]) {
      const light = new THREE.Mesh(geometry, panel)
      light.rotation.x = Math.PI / 2
      light.position.set(x, 6.9, z)
      scene.add(light)
    }
  }
  return scene
}

/**
 * A soft environment for reflections, generated once (no image files): stone floors,
 * plinths and trim get a sheen that moves as the visitor walks. Only the materials that
 * show it sample it (see `reflects`); it is in place before the first shader compile.
 */
function Reflections() {
  const gl = useThree((state) => state.gl)
  useLayoutEffect(() => {
    const generator = new THREE.PMREMGenerator(gl)
    const room = galleryEnvironment()
    const target = generator.fromScene(room, 0.04)
    setEnvironment(target.texture)
    room.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        ;(object.material as THREE.Material).dispose()
      }
    })
    generator.dispose()
    return () => {
      setEnvironment(null)
      target.dispose()
    }
  }, [gl])
  return null
}

/**
 * Museum-wide base light: a soft, slightly warm sky and a pale ground, the light of a
 * gallery under laylights, where the floor bounces light back onto the walls (#48),
 * plus one weak key that separates wall planes. How bright each space feels comes
 * mostly from its palette; realtime light is reserved for exhibits (see Downlight).
 */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#f1eee8', '#8d877d', 3.4]} />
      <directionalLight position={[-5, 9, 4]} intensity={1.4} color="#fff6ea" />
      <Reflections />
    </>
  )
}
