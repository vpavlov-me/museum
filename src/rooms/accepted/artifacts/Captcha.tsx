import { useCallback, useMemo, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { useSound } from '../../../audio/useSound'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { Text } from '../../../components/Text'
import { INK_ON_LIGHT } from '../../../identity'
import { useRoomFrame } from '../../../museum/RoomContext'
import { roundedRect } from '../../../scene/geometry'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial, FIXTURE_MATERIAL } from '../../../scene/materials'
import { CARDS, LAYOUT } from '../content'
import { SCREEN, since } from './shared'

const PANEL = { width: 2.6, height: 3.6, centre: 2.15 }
const TILE = 0.74
const GAP = 0.04
const CHECKING = 1.3
/** The third attempt passes; the panel resets a while after. */
const PASS_ON = 3
const RESET_AFTER = 8

type Stage = 'idle' | 'checking' | 'retry' | 'pass'
const HEADLINES: Record<Stage, string> = {
  idle: 'crossings',
  checking: 'Verifying…',
  retry: 'Please try again.',
  pass: 'Verified. Thank you.',
}

type Image = 'crossing' | 'car' | 'tree' | 'sky'
const IMAGES: Image[] = ['crossing', 'car', 'tree', 'sky']
const GROUNDS = ['#7d7a72', '#6a7076', '#8a8270', '#5f6763', '#7b7268', '#6e6a64'].map(basicMaterial)
const WHITE = basicMaterial('#efeee9')
const DARK = basicMaterial('#2c2b29')
const GREEN = basicMaterial('#5c8a52')
const SKY = basicMaterial('#a8b8c4')
const CHECK = basicMaterial('#4bb06a')

/**
 * Exhibit 04. A CAPTCHA, on the wall at full height, as the gate it used to be in Room 02
 * but no longer in anybody's way. Verifying takes a moment and usually fails; the
 * third try passes, with thanks.
 */
export function Captcha() {
  const [x, wall] = LAYOUT.captcha
  const z = wall + 0.02
  const clock = useThree((state) => state.clock)
  const [stage, setStage] = useState<Stage>('idle')
  const [tries, setTries] = useState(0)
  const at = useRef(-Infinity)
  const play = useSound()

  const verify = useCallback(() => {
    if (stage === 'checking' || stage === 'pass') return
    at.current = clock.elapsedTime
    setStage('checking')
    play('captcha-check', [x, 1.6, z])
  }, [stage, clock, play, x, z])
  useFocusTarget({ id: 'captcha', position: [x, 1.6, z], distance: 4.2, card: CARDS.captcha, labelled: true, prompt: stage === 'idle' || stage === 'retry' ? 'VERIFY' : null, onInteract: verify })

  useRoomFrame(({ clock }) => {
    const t = since(at.current, clock.elapsedTime)
    if (stage === 'checking' && t > CHECKING) {
      const next = tries + 1
      setTries(next)
      at.current = clock.elapsedTime
      if (next >= PASS_ON) {
        setStage('pass')
        play('captcha-pass', [x, 1.6, z])
      } else {
        setStage('retry')
        play('captcha-retry', [x, 1.6, z])
      }
    } else if (stage === 'pass' && t > RESET_AFTER) {
      setStage('idle')
      setTries(0)
    }
  })

  // Each attempt deals a new set of pictures.
  const tiles = useMemo(() => Array.from({ length: 9 }, (_, i) => ({ image: IMAGES[(i * 3 + tries * 5 + (i % 2)) % IMAGES.length], ground: GROUNDS[(i + tries * 2) % GROUNDS.length] })), [tries])
  const grid = TILE * 3 + GAP * 2

  return (
    <group position={[x, PANEL.centre, z]}>
      {/* A bronze frame, as for anything hung in the museum. */}
      <mesh position={[0, 0, -0.012]} material={FIXTURE_MATERIAL}>
        <boxGeometry args={[PANEL.width + 0.08, PANEL.height + 0.08, 0.02]} />
      </mesh>
      <mesh geometry={roundedRect(PANEL.width, PANEL.height, 0.02)} material={SCREEN.paper} />
      <group position={[0, PANEL.height / 2 - 0.42, 0.002]}>
        <mesh material={SCREEN.blueFill}>
          <planeGeometry args={[grid, 0.62]} />
        </mesh>
        <Text position={[-grid / 2 + 0.12, 0.13, 0.002]} fontSize={0.075} color="#ffffff" anchorX="left" anchorY="middle">
          {stage === 'idle' ? 'Select all squares with' : ' '}
        </Text>
        <Text position={[-grid / 2 + 0.12, -0.08, 0.002]} fontSize={0.15} color="#ffffff" anchorX="left" anchorY="middle">
          {HEADLINES[stage]}
        </Text>
      </group>
      <group position={[0, -0.18, 0.002]}>
        {tiles.map((tile, i) => {
          const cx = ((i % 3) - 1) * (TILE + GAP)
          const cy = (1 - Math.floor(i / 3)) * (TILE + GAP)
          return (
            <group key={i} position={[cx, cy, 0]} visible={stage !== 'pass'}>
              <mesh material={tile.ground}>
                <planeGeometry args={[TILE, TILE]} />
              </mesh>
              <Picture image={tile.image} />
            </group>
          )
        })}
        {/* Passed: a check mark, drawn as two strokes. */}
        {stage === 'pass' && (
          <group position={[0, 0, 0.002]}>
            <mesh position={[-0.16, -0.05, 0]} rotation={[0, 0, -Math.PI / 4]} material={CHECK}>
              <planeGeometry args={[0.3, 0.08]} />
            </mesh>
            <mesh position={[0.1, 0.07, 0]} rotation={[0, 0, Math.PI / 4]} material={CHECK}>
              <planeGeometry args={[0.6, 0.08]} />
            </mesh>
          </group>
        )}
      </group>
      <group position={[grid / 2 - 0.36, -PANEL.height / 2 + 0.3, 0.002]}>
        <mesh geometry={roundedRect(0.72, 0.22, 0.03)} material={SCREEN.blueFill} />
        <Text position={[0, 0, 0.002]} fontSize={0.075} letterSpacing={0.08} color="#ffffff" anchorX="center" anchorY="middle">
          VERIFY
        </Text>
      </group>
      <ExhibitLabel position={[PANEL.width / 2 + 0.35, 0.3, -0.01]} exhibit={CARDS.captcha} width={1.1} ink={INK_ON_LIGHT} />
    </group>
  )
}

/** A tile's picture, in a few flat shapes: a zebra crossing, a car, a tree, or only sky. */
function Picture({ image }: { image: Image }) {
  const z = 0.002
  switch (image) {
    case 'crossing':
      return (
        <>
          {[-0.24, -0.08, 0.08, 0.24].map((dx) => (
            <mesh key={dx} position={[dx, -0.12, z]} material={WHITE}>
              <planeGeometry args={[0.09, 0.4]} />
            </mesh>
          ))}
        </>
      )
    case 'car':
      return (
        <>
          <mesh position={[0, -0.08, z]} geometry={roundedRect(0.5, 0.18, 0.05)} material={DARK} />
          <mesh position={[0, 0.04, z]} geometry={roundedRect(0.3, 0.14, 0.05)} material={DARK} />
        </>
      )
    case 'tree':
      return (
        <>
          <mesh position={[0, -0.2, z]} material={DARK}>
            <planeGeometry args={[0.06, 0.24]} />
          </mesh>
          <mesh position={[0, 0.06, z]} geometry={roundedRect(0.4, 0.4, 0.2)} material={GREEN} />
        </>
      )
    default:
      return (
        <mesh position={[0, 0.18, z]} material={SKY}>
          <planeGeometry args={[TILE, TILE * 0.4]} />
        </mesh>
      )
  }
}
