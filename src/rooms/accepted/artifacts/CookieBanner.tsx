import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { Text } from '../../../components/Text'
import { INK } from '../../../identity'
import { useRoomFrame } from '../../../museum/RoomContext'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { BANNER_Z, CARDS, CELLS } from '../content'
import { roundedRect, useVisitorAway } from '../shared'

// The banner spans the room except for a narrow gap at the east wall: the "manage preferences" route.
// The visitor enters at the west end, so the way around is the far side of the room.
const BANNER = { minX: CELLS.interrupt.minX, maxX: CELLS.interrupt.maxX - 1.3, height: 2.3, depth: 0.18 }
const WIDTH = BANNER.maxX - BANNER.minX
const CENTER_X = (BANNER.minX + BANNER.maxX) / 2
const FACE_Z = BANNER.depth / 2 + 0.002
const ACCEPT = { x: BANNER.maxX - 1.9, y: 1.12, width: 2, height: 0.5 }
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
  const play = useSound()

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

  useRoomFrame((_, delta) => {
    sunk.current = THREE.MathUtils.damp(sunk.current, accepted ? 1 : 0, 2.6, delta)
    if (group.current) {
      group.current.position.y = -(BANNER.height + 0.1) * sunk.current
      group.current.visible = sunk.current < 0.995
    }
  })

  useObstacle('cookie-banner', blocking ? rect(BANNER.minX, BANNER.maxX, BANNER_Z - BANNER.depth / 2, BANNER_Z + BANNER.depth / 2) : null)

  // Read from a distance; accept only from up close.
  useFocusTarget({ id: 'cookie-banner', position: [CENTER_X, 1.2, BANNER_Z], distance: 6, facing: 0.6, card: accepted ? null : CARDS.banner, labelled: true })
  useFocusTarget({
    id: 'cookie-banner-accept',
    position: [ACCEPT.x, ACCEPT.y, BANNER_Z],
    distance: 3.4,
    card: accepted ? null : CARDS.banner,
    labelled: true,
    prompt: accepted ? null : 'ACCEPT ALL',
    onInteract: () => {
      setAccepted(true)
      play('banner-accept', [CENTER_X, 1.2, BANNER_Z])
    },
  })

  return (
    <group ref={group} position={[0, 0, BANNER_Z]}>
      <mesh position={[CENTER_X, BANNER.height / 2, 0]} material={PALETTES.accepted.reveal}>
        <boxGeometry args={[WIDTH, BANNER.height, BANNER.depth]} />
      </mesh>
      <mesh position={[CENTER_X, BANNER.height / 2, FACE_Z]} material={basicMaterial('#e6e3da')}>
        <planeGeometry args={[WIDTH, BANNER.height]} />
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

        <mesh position={[ACCEPT.x, ACCEPT.y, 0]} geometry={roundedRect(ACCEPT.width, ACCEPT.height, 0.25)} material={basicMaterial('#141414')} />
        <Text position={[ACCEPT.x, ACCEPT.y, 0.002]} fontSize={0.15} color={INK.text} anchorX="center" anchorY="middle">
          Accept all
        </Text>

        <Text position={[BANNER.maxX - 0.35, 0.42, 0]} fontSize={0.085} color="#7a7770" anchorX="right" anchorY="middle">
          Manage preferences →
        </Text>
      </group>
    </group>
  )
}
