import { useCallback, useRef, useState } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { ExhibitLabel } from '../../../components/ExhibitLabel'
import { Plinth } from '../../../components/Plinth'
import { Text } from '../../../components/Text'
import { facingRotation } from '../../../components/WallText'
import { INK_ON_LIGHT } from '../../../identity'
import { useRoomFrame } from '../../../museum/RoomContext'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { roundedRect } from '../../../scene/geometry'
import { OAK_MATERIAL } from '../../../scene/materials'
import { CARDS, LAYOUT, MODALS, type ModalLayer } from '../content'
import { SCREEN } from './shared'

const PLINTH = { width: 2.6, height: 0.95, depth: 0.9 }
const DIALOG = { width: 1.5, height: 0.86 }
/** Each dialog stands this far behind the one in front of it, and a little higher. */
const STEP = { back: 0.24, up: 0.14 }
/** Closed, a dialog sinks into the plinth; when all are closed they come back. */
const RETURN_AFTER = 6
const SCRIM = new THREE.MeshBasicMaterial({ color: '#1d1d1b', transparent: true, opacity: 0.08, depthWrite: false })

/**
 * Exhibit 02. Three modal dialogs stacked one behind another on a plinth, each with the
 * dimmed scrim of the one in front: the way they arrive on a screen, made into a
 * sculpture. Closing the front one shows the next; when they are all gone they return.
 */
export function ModalStack() {
  const [x, z] = LAYOUT.modals
  const clock = useThree((state) => state.clock)
  const [closed, setClosed] = useState(0)
  const allClosedAt = useRef(-Infinity)
  const play = useSound()

  useObstacle('modals', box(x, z, PLINTH.depth, PLINTH.width))
  const close = useCallback(() => {
    if (closed >= MODALS.length) return
    play('modal-close', [x, 1.4, z])
    const next = closed + 1
    if (next === MODALS.length) allClosedAt.current = clock.elapsedTime
    setClosed(next)
  }, [closed, clock, play, x, z])
  useFocusTarget({ id: 'modals', position: [x + 0.2, 1.3, z], card: CARDS.modal, labelled: true, prompt: closed < MODALS.length ? 'CLOSE' : null, onInteract: close })

  useRoomFrame(({ clock }) => {
    if (closed === MODALS.length && clock.elapsedTime - allClosedAt.current > RETURN_AFTER) {
      play('modal-open', [x, 1.4, z])
      setClosed(0)
    }
  })

  return (
    <group position={[x, 0, z]} rotation={facingRotation('east')}>
      <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} material={OAK_MATERIAL} />
      {MODALS.map((layer, i) => {
        const depth = (MODALS.length - 1 - i) * STEP.back
        return (
          <group key={layer.title} position={[(i - 1) * 0.18, PLINTH.height + 0.12 + (MODALS.length - 1 - i) * STEP.up, -depth + 0.12]} visible={i >= closed}>
            {/* The scrim this dialog casts over everything behind it. */}
            {i > 0 && (
              <mesh position={[0, DIALOG.height / 2, -0.05]} material={SCRIM}>
                <planeGeometry args={[DIALOG.width + 0.5, DIALOG.height + 0.24]} />
              </mesh>
            )}
            <Dialog layer={layer} />
          </group>
        )
      })}
      <ExhibitLabel position={[-PLINTH.width / 2 + 0.14, PLINTH.height - 0.1, PLINTH.depth / 2 + 0.004]} exhibit={CARDS.modal} width={PLINTH.width - 0.28} ink={INK_ON_LIGHT} />
    </group>
  )
}

function Dialog({ layer }: { layer: ModalLayer }) {
  const { width: w, height: h } = DIALOG
  return (
    <group position={[0, h / 2, 0]}>
      <mesh geometry={roundedRect(w, h, 0.05)} material={SCREEN.paper} />
      <Text position={[-w / 2 + 0.09, h / 2 - 0.1, 0.002]} fontSize={0.068} maxWidth={w - 0.18} color={SCREEN.ink} anchorX="left" anchorY="top">
        {layer.title}
      </Text>
      <Text position={[-w / 2 + 0.09, h / 2 - 0.27, 0.002]} fontSize={0.045} lineHeight={1.4} maxWidth={w - 0.18} color={SCREEN.muted} anchorX="left" anchorY="top">
        {layer.body}
      </Text>
      <group position={[w / 2 - 0.3, -h / 2 + 0.14, 0.002]}>
        <mesh geometry={roundedRect(0.44, 0.13, 0.03)} material={SCREEN.blueFill} />
        <Text position={[0, 0, 0.001]} fontSize={0.05} color="#ffffff" anchorX="center" anchorY="middle">
          {layer.primary}
        </Text>
      </group>
      <Text position={[-w / 2 + 0.09, -h / 2 + 0.14, 0.002]} fontSize={0.038} maxWidth={w - 0.65} color={SCREEN.muted} anchorX="left" anchorY="middle">
        {layer.secondary}
      </Text>
    </group>
  )
}
