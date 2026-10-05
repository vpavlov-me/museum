import { useEffect, useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { box } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { CARDS, HALL, MODALS, type ModalLayer } from '../content'
import { roundedRect, useVisitorAway } from '../shared'

const SCRIM_OPACITY = 0.36
// Dialogs float a little in front of their own scrim.
const DIALOG_OFFSET = 0.35

function Modal({ layer, index, closed, onClose }: { layer: ModalLayer; index: number; closed: boolean; onClose: () => void }) {
  const scrim = useRef<THREE.Mesh>(null)
  const scrimMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const dialog = useRef<THREE.Group>(null)
  const dismissed = useRef(0)
  const { width: w, height: h } = layer
  const z = layer.z + DIALOG_OFFSET

  useFrame((_, delta) => {
    dismissed.current = THREE.MathUtils.damp(dismissed.current, closed ? 1 : 0, 10, delta)
    const k = dismissed.current
    if (scrimMaterial.current) scrimMaterial.current.opacity = SCRIM_OPACITY * (1 - k)
    if (scrim.current) scrim.current.visible = k < 0.99
    if (dialog.current) {
      dialog.current.scale.setScalar(Math.max(0.001, 1 - k))
      dialog.current.visible = k < 0.99
    }
  })

  useObstacle(`modal-${index}`, closed ? null : box(layer.x, z, w, 0.2))
  useFocusTarget({
    id: `modal-${index}`,
    position: [layer.x, layer.y, z],
    card: closed ? null : CARDS.modal,
    prompt: closed ? null : 'CLOSE',
    onInteract: onClose,
  })

  const stem = layer.y - h / 2

  return (
    <>
      {/* The dimmed overlay: light, not matter. Walking through it is allowed. */}
      <mesh ref={scrim} position={[0, HALL.height / 2, layer.z]}>
        <planeGeometry args={[HALL.maxX - HALL.minX, HALL.height]} />
        <meshBasicMaterial ref={scrimMaterial} color="#050505" transparent opacity={SCRIM_OPACITY} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>

      <group ref={dialog} position={[layer.x, layer.y, z]}>
        <mesh position={[0, -h / 2 - stem / 2, -0.03]}>
          <boxGeometry args={[0.03, stem, 0.03]} />
          <meshStandardMaterial color="#1d1c1b" roughness={0.8} />
        </mesh>
        <mesh>
          <boxGeometry args={[w, h, 0.05]} />
          <meshStandardMaterial color="#1d1c1b" roughness={0.8} />
        </mesh>
        <group position={[0, 0, 0.027]}>
          <mesh>
            <planeGeometry args={[w, h]} />
            <meshBasicMaterial color="#efede6" />
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
          <mesh position={[w / 2 - 0.55, -h / 2 + 0.26, 0.002]} geometry={roundedRect(0.78, 0.24, 0.12)}>
            <meshBasicMaterial color="#141414" />
          </mesh>
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
 * The room beyond grows darker with every layer. Each dialog can be closed with E,
 * and they all return on the next visit.
 */
export function ModalStack() {
  const away = useVisitorAway()
  const [closed, setClosed] = useState(() => MODALS.map(() => false))

  useEffect(() => {
    if (away) setClosed(MODALS.map(() => false))
  }, [away])

  return (
    <>
      {MODALS.map((layer, i) => (
        <Modal
          key={layer.title}
          layer={layer}
          index={i}
          closed={closed[i]}
          onClose={() => setClosed((current) => current.map((value, j) => (j === i ? true : value)))}
        />
      ))}
    </>
  )
}
