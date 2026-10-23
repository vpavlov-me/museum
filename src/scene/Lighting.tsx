import { useLayoutEffect } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { setEnvironment } from './materials'

/**
 * What polished surfaces reflect: a tall daylit hall like v3's lobby and hall (#48),
 * grey walls under a band of bright windows. Oak and bronze then show the windows'
 * light moving across them as the visitor walks.
 */
function galleryEnvironment() {
  const scene = new THREE.Scene()
  const shell = new THREE.Mesh(new THREE.BoxGeometry(24, 12, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#9d9b96'), side: THREE.BackSide }))
  shell.position.y = 6
  scene.add(shell)
  const daylight = new THREE.MeshBasicMaterial({ color: new THREE.Color('#fbf8f2').multiplyScalar(2.4), side: THREE.DoubleSide })
  const band = (length: number) => new THREE.PlaneGeometry(length, 2.2)
  for (const [x, z, length, turn] of [
    [0, -15.9, 22, 0],
    [0, 15.9, 22, 0],
    [-11.9, 0, 30, Math.PI / 2],
    [11.9, 0, 30, Math.PI / 2],
  ] as const) {
    const window = new THREE.Mesh(band(length), daylight)
    window.position.set(x, 10.3, z)
    window.rotation.y = turn
    scene.add(window)
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
 * Museum-wide base light: daylight from high windows (#48), a soft, slightly warm sky
 * and a pale ground the oak bounces back onto the walls, plus a low sun that separates
 * wall planes. How bright each space feels comes mostly from its palette; the closed
 * rooms still light their exhibits with Downlight fixtures.
 */
export function Lighting() {
  return (
    <>
      <hemisphereLight args={['#f1eee8', '#8d877d', 3.4]} />
      <directionalLight position={[-6, 14, 5]} intensity={1.6} color="#fff4e4" />
      <Reflections />
    </>
  )
}
