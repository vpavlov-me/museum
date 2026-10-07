import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { setEnvironment } from './materials'

/**
 * What polished surfaces reflect: a dark gallery, its ceiling broken by long light
 * panels, like the museum's own rooms. Dark stone then reflects darkness and lights,
 * not a pale sky, and reads darker and deeper the more polished it is.
 */
function galleryEnvironment() {
  const scene = new THREE.Scene()
  const shell = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color('#1c1b1a'), side: THREE.BackSide }))
  shell.position.y = 3
  scene.add(shell)
  const panel = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4e2').multiplyScalar(3.2), side: THREE.DoubleSide })
  const geometry = new THREE.PlaneGeometry(1.2, 9)
  for (const x of [-6, -2, 2, 6]) {
    const light = new THREE.Mesh(geometry, panel)
    light.rotation.x = Math.PI / 2
    light.position.set(x, 5.9, 0)
    scene.add(light)
  }
  // A paler band of wall, where the light washes it.
  const wash = new THREE.Mesh(new THREE.PlaneGeometry(24, 2.4), new THREE.MeshBasicMaterial({ color: new THREE.Color('#5a5650'), side: THREE.DoubleSide }))
  wash.position.set(0, 2.2, -11.9)
  scene.add(wash)
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
 * Museum-wide base light: a warm sky and a dark ground, so floors read lighter than
 * ceilings and walls fall in between, plus one weak key that separates wall planes.
 * How bright each space feels comes mostly from its palette; realtime light is
 * reserved for exhibits (see Downlight).
 */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#ebe7df', '#2a2724', 4]} />
      <directionalLight position={[-5, 9, 4]} intensity={1.4} color="#fff6ea" />
      <Reflections />
    </>
  )
}
