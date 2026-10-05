import { useEffect, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { BANNER_Z, CARDS, HALL } from '../content'
import { roundedRect, useVisitorAway } from '../shared'

// The banner spans the room except for a narrow gap at the east wall: the "manage preferences" route.
const BANNER = { minX: HALL.minX, maxX: 4.8, height: 2.3, depth: 0.18 }
const WIDTH = BANNER.maxX - BANNER.minX
const CENTER_X = (BANNER.minX + BANNER.maxX) / 2
const FACE_Z = BANNER.depth / 2 + 0.002
const ACCEPT = { x: 2.9, y: 1.12, width: 2, height: 0.5 }
// Collision is released once the top edge has sunk below the knees.
const RELEASE_AFTER_MS = 900

/**
 * Exhibit 01. A consent banner as architecture: a bright slab at the bottom of the
 * "viewport", standing between the visitor and the room. You can squeeze past it
 * at the edge, or accept, and it sinks into the floor. It returns on the next visit.
 */
export function CookieBanner() {
  const away = useVisitorAway()
  const [accepted, setAccepted] = useState(false)
  const [blocking, setBlocking] = useState(true)
  const group = useRef<THREE.Group>(null)
  const sunk = useRef(0)

  useEffect(() => {
    if (!accepted) return
    const timer = window.setTimeout(() => setBlocking(false), RELEASE_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [accepted])

  useEffect(() => {
    if (away && accepted) {
      setAccepted(false)
      setBlocking(true)
    }
  }, [away, accepted])

  useFrame((_, delta) => {
    sunk.current = THREE.MathUtils.damp(sunk.current, accepted ? 1 : 0, 2.6, delta)
    if (group.current) {
      group.current.position.y = -(BANNER.height + 0.1) * sunk.current
      group.current.visible = sunk.current < 0.995
    }
  })

  useObstacle('cookie-banner', blocking ? rect(BANNER.minX, BANNER.maxX, BANNER_Z - BANNER.depth / 2, BANNER_Z + BANNER.depth / 2) : null)

  // Read from a distance; accept only from up close.
  useFocusTarget({ id: 'cookie-banner', position: [CENTER_X, 1.2, BANNER_Z], distance: 6, facing: 0.6, card: accepted ? null : CARDS.banner })
  useFocusTarget({
    id: 'cookie-banner-accept',
    position: [ACCEPT.x, ACCEPT.y, BANNER_Z],
    distance: 3.4,
    card: accepted ? null : CARDS.banner,
    prompt: accepted ? null : 'ACCEPT ALL',
    onInteract: () => setAccepted(true),
  })

  return (
    <group ref={group} position={[0, 0, BANNER_Z]}>
      <mesh position={[CENTER_X, BANNER.height / 2, 0]}>
        <boxGeometry args={[WIDTH, BANNER.height, BANNER.depth]} />
        <meshStandardMaterial color="#262624" roughness={0.9} />
      </mesh>
      <mesh position={[CENTER_X, BANNER.height / 2, FACE_Z]}>
        <planeGeometry args={[WIDTH, BANNER.height]} />
        <meshBasicMaterial color="#e6e3da" />
      </mesh>

      <group position={[0, 0, FACE_Z + 0.002]}>
        <Text position={[BANNER.minX + 0.7, 1.9, 0]} fontSize={0.3} letterSpacing={-0.02} color="#141414" anchorX="left" anchorY="top">
          We value your privacy.
        </Text>
        <Text
          position={[BANNER.minX + 0.7, 1.36, 0]}
          fontSize={0.12}
          lineHeight={1.5}
          maxWidth={5.4}
          color="#4a4844"
          anchorX="left"
          anchorY="top"
        >
          We and our 847 partners use cookies and similar technologies to personalise content, measure performance and remember that you were here. By continuing to walk through this room, you agree to all of the above.
        </Text>

        <mesh position={[ACCEPT.x, ACCEPT.y, 0]} geometry={roundedRect(ACCEPT.width, ACCEPT.height, 0.25)}>
          <meshBasicMaterial color="#141414" />
        </mesh>
        <Text position={[ACCEPT.x, ACCEPT.y, 0.002]} fontSize={0.15} color="#efede6" anchorX="center" anchorY="middle">
          Accept all
        </Text>

        <Text position={[BANNER.maxX - 0.35, 0.42, 0]} fontSize={0.085} color="#7a7770" anchorX="right" anchorY="middle">
          Manage preferences →
        </Text>
      </group>
    </group>
  )
}
