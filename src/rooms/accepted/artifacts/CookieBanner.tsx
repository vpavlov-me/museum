import { useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { Text } from '../../../components/Text'
import { motion } from '../../../museum/capabilities'
import { useRoomFrame } from '../../../museum/RoomContext'
import { useFocusTarget } from '../../../scene/Interaction'
import { FIXTURE_MATERIAL } from '../../../scene/materials'
import { CARDS, LAYOUT } from '../content'
import { CEILING, SCREEN, since } from './shared'

const { from, to, z, bottom, height } = LAYOUT.banner
const WIDTH = to - from - 0.4
const CENTRE = (from + to) / 2
/** Accepted, it rises out of the way, waits, and comes down again for the next visitor. */
const RISE = 6
const AWAY_FOR = 25

/**
 * Exhibit 01. The cookie banner as a banner: a white sheet hung across bay I on two cables,
 * its lower edge above head height, so it is walked under rather than through. Accepting
 * it hauls it up into the light; after a while it comes back down.
 */
export function CookieBanner() {
  const clock = useThree((state) => state.clock)
  const sheet = useRef<THREE.Group>(null)
  const acceptedAt = useRef(-Infinity)
  const lift = useRef(0)
  const play = useSound()

  const accept = useCallback(() => {
    if (since(acceptedAt.current, clock.elapsedTime) < AWAY_FOR) return
    acceptedAt.current = clock.elapsedTime
    play('banner-accept', [CENTRE, bottom, z])
  }, [clock, play])

  useFocusTarget({ id: 'banner', position: [CENTRE + 1, 1.6, z], distance: 4.5, card: CARDS.banner, labelled: true, prompt: 'ACCEPT ALL', onInteract: accept })

  useRoomFrame(({ clock }, delta) => {
    const up = since(acceptedAt.current, clock.elapsedTime) < AWAY_FOR ? 1 : 0
    lift.current = motion.reduced ? up : THREE.MathUtils.damp(lift.current, up, up ? 1.2 : 0.6, delta)
    if (sheet.current) sheet.current.position.y = bottom + height / 2 + lift.current * RISE
  })

  const cable = CEILING - bottom - height
  return (
    <group position={[CENTRE, 0, z]}>
      <group ref={sheet} position={[0, bottom + height / 2, 0]}>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * (WIDTH / 2 - 0.3), height / 2 + cable / 2, 0]} material={FIXTURE_MATERIAL}>
            <boxGeometry args={[0.006, cable, 0.006]} />
          </mesh>
        ))}
        <mesh material={SCREEN.paper}>
          <boxGeometry args={[WIDTH, height, 0.04]} />
        </mesh>
        <group position={[-WIDTH / 2 + 0.4, 0, 0.022]}>
          <Text position={[0, 0.38, 0]} fontSize={0.15} color={SCREEN.ink} anchorX="left" anchorY="middle">
            We value your privacy
          </Text>
          <Text position={[0, 0.06, 0]} fontSize={0.075} lineHeight={1.45} maxWidth={3.6} color={SCREEN.muted} anchorX="left" anchorY="top">
            We and our 847 partners use cookies to personalise content, measure ads and improve your experience. By clicking “Accept all” you agree to all of it.
          </Text>
        </group>
        <group position={[WIDTH / 2 - 1.15, 0.08, 0.022]}>
          <mesh material={SCREEN.blueFill}>
            <planeGeometry args={[1.6, 0.4]} />
          </mesh>
          <Text position={[0, 0, 0.002]} fontSize={0.11} color="#ffffff" anchorX="center" anchorY="middle">
            Accept all
          </Text>
          <Text position={[0, -0.42, 0]} fontSize={0.065} color={SCREEN.muted} anchorX="center" anchorY="middle">
            Manage preferences
          </Text>
        </group>
      </group>
    </group>
  )
}
