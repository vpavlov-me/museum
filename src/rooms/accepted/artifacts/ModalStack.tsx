import { useEffect, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { useRoom, useRoomFrame } from '../../../museum/RoomContext'
import { museumStore } from '../../../museum/store'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { CARDS, CELLS, MODALS, type ModalLayer } from '../content'
import { roundedRect, useVisitorAway } from '../shared'

const SCRIM_OPACITY = 0.3
// Dialogs float a little in front of their own scrim.
const DIALOG_OFFSET = 0.35
// A dialog interrupts once the visitor comes this close to it (metres south of its scrim)...
const TRIGGER = 4.2
// ...but never on top of them: they must still be this far short of it.
const CLEARANCE = 1.2
const ROOM = CELLS.interrupt
const ROOM_X = (ROOM.minX + ROOM.maxX) / 2
const ROOM_WIDTH = ROOM.maxX - ROOM.minX
const FRAME = PALETTES.accepted.reveal

type State = { shown: boolean; closed: boolean }

function Modal({ layer, index, state, onShow, onClose }: { layer: ModalLayer; index: number; state: State; onShow: () => void; onClose: () => void }) {
  const { id: roomId, origin } = useRoom()
  const scrim = useRef<THREE.Mesh>(null)
  const scrimMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const dialog = useRef<THREE.Group>(null)
  const presence = useRef(0)
  const { width: w, height: h } = layer
  const z = layer.z + DIALOG_OFFSET
  const open = state.shown && !state.closed

  useRoomFrame(({ camera }, delta) => {
    // Nobody asked for it: the dialog appears as the visitor walks up to it.
    if (!state.shown && museumStore.get().spaceId === roomId) {
      const ahead = camera.position.z - origin[1] - layer.z
      if (ahead < TRIGGER && ahead > CLEARANCE + DIALOG_OFFSET) onShow()
    }

    // Arrives quickly, leaves quickly; the scrim dims the room behind it as it comes in.
    presence.current = THREE.MathUtils.damp(presence.current, open ? 1 : 0, open ? 7 : 10, delta)
    const k = presence.current
    if (scrimMaterial.current) scrimMaterial.current.opacity = SCRIM_OPACITY * k
    if (scrim.current) scrim.current.visible = k > 0.01
    if (dialog.current) {
      const pop = state.closed ? k : Math.min(1, k * 1.08)
      dialog.current.scale.setScalar(Math.max(0.001, pop))
      dialog.current.visible = k > 0.01
    }
  })

  useObstacle(`modal-${index}`, open ? box(layer.x, z, w, 0.2) : null)
  useFocusTarget({
    id: `modal-${index}`,
    position: [layer.x, layer.y, z],
    card: open ? CARDS.modal : null,
    labelled: true,
    prompt: open ? 'CLOSE' : null,
    onInteract: onClose,
  })

  const stem = layer.y - h / 2

  return (
    <>
      {/* The dimmed overlay: light, not matter. Walking through it is allowed. */}
      <mesh ref={scrim} position={[ROOM_X, ROOM.height / 2, layer.z]} visible={false}>
        <planeGeometry args={[ROOM_WIDTH, ROOM.height]} />
        <meshBasicMaterial ref={scrimMaterial} color="#050505" transparent opacity={0} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <group ref={dialog} position={[layer.x, layer.y, z]} visible={false}>
        <mesh position={[0, -h / 2 - stem / 2, -0.03]} material={FRAME}>
          <boxGeometry args={[0.03, stem, 0.03]} />
        </mesh>
        <mesh material={FRAME}>
          <boxGeometry args={[w, h, 0.05]} />
        </mesh>
        <group position={[0, 0, 0.027]}>
          <mesh material={basicMaterial('#efede6')}>
            <planeGeometry args={[w, h]} />
          </mesh>
          <Text position={[w / 2 - 0.16, h / 2 - 0.12, 0.002]} fontSize={0.12} color="#7a7770" anchorX="center" anchorY="middle">
            ×
          </Text>
          <Text
            position={[-w / 2 + 0.18, h / 2 - 0.18, 0.002]}
            fontSize={0.14}
            lineHeight={1.1}
            maxWidth={w - 0.55}
            color="#141414"
            anchorX="left"
            anchorY="top"
          >
            {layer.title}
          </Text>
          <Text
            position={[-w / 2 + 0.18, h / 2 - 0.58, 0.002]}
            fontSize={0.075}
            lineHeight={1.45}
            maxWidth={w - 0.4}
            color="#4a4844"
            anchorX="left"
            anchorY="top"
          >
            {layer.body}
          </Text>
          <mesh position={[w / 2 - 0.55, -h / 2 + 0.26, 0.002]} geometry={roundedRect(0.78, 0.24, 0.12)} material={basicMaterial('#141414')} />
          <Text position={[w / 2 - 0.55, -h / 2 + 0.26, 0.004]} fontSize={0.08} color="#efede6" anchorX="center" anchorY="middle">
            {layer.primary}
          </Text>
          <Text
            position={[-w / 2 + 0.18, -h / 2 + 0.26, 0.002]}
            fontSize={0.06}
            maxWidth={w - 1.25}
            lineHeight={1.3}
            color="#7a7770"
            anchorX="left"
            anchorY="middle"
          >
            {layer.secondary}
          </Text>
        </group>
      </group>
    </>
  )
}

/**
 * Exhibit 03. Three overlays stacked in depth, each dimming everything behind it.
 * Nobody opens them: each one appears as the visitor approaches, and the room beyond
 * grows darker with every layer. Each dialog can be closed with E. They all return
 * on the next visit.
 */
export function ModalStack() {
  const away = useVisitorAway()
  const initial = () => MODALS.map(() => ({ shown: false, closed: false }))
  const [states, setStates] = useState<State[]>(initial)

  useEffect(() => {
    if (away) setStates(initial)
  }, [away])

  const update = (i: number, patch: Partial<State>) =>
    setStates((current) => current.map((state, j) => (j === i ? { ...state, ...patch } : state)))

  return (
    <>
      {MODALS.map((layer, i) => (
        <Modal
          key={layer.title}
          layer={layer}
          index={i}
          state={states[i]}
          onShow={() => update(i, { shown: true })}
          onClose={() => update(i, { closed: true })}
        />
      ))}
    </>
  )
}
