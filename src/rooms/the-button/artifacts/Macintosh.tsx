import { useEffect, useMemo, useState } from 'react'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, held, roundedOutline, roundedRect, type ArtifactProps } from './shared'

const WHITE = '#f4f4f0'
const BLACK = '#111111'
const KEY = { width: 0.46, height: 0.17, radius: 0.07 }

/**
 * 1984. An alert from the first Macintosh, in one bit: a question, Cancel, and the
 * default answer ringed by a heavier border. A press highlights it, black for white.
 */
export function Macintosh({ label, pressedAt }: ArtifactProps) {
  const { width } = BUTTON
  const height = MAC_HEIGHT
  const [down, setDown] = useState(false)
  useRoomFrame(({ clock }) => {
    const now = held(pressedAt, clock.elapsedTime, 0.3) === 1
    if (now !== down) setDown(now)
  })

  const shapes = useMemo(
    () => ({
      frame: roundedOutline(width - 0.06, height - 0.06, 0.004, 0.022),
      key: roundedOutline(KEY.width, KEY.height, KEY.radius, 0.008),
      fill: roundedRect(KEY.width, KEY.height, KEY.radius),
      ring: roundedOutline(KEY.width + 0.07, KEY.height + 0.07, KEY.radius + 0.035, 0.022),
    }),
    [width, height],
  )
  useEffect(() => () => Object.values(shapes).forEach((shape) => shape.dispose()), [shapes])

  const z = 0.011
  const row = -0.2
  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.02]} />
        <meshBasicMaterial color={WHITE} />
      </mesh>
      <mesh position={[0, 0, z]} geometry={shapes.frame}>
        <meshBasicMaterial color={BLACK} />
      </mesh>
      <Text position={[-0.78, 0.22, z]} fontSize={0.075} maxWidth={1.5} color={BLACK} anchorX="left" anchorY="middle">
        Save changes before closing?
      </Text>
      {/* Cancel: an ordinary button. */}
      <mesh position={[-0.05, row, z]} geometry={shapes.key}>
        <meshBasicMaterial color={BLACK} />
      </mesh>
      <Text position={[-0.05, row, z]} fontSize={0.07} color={BLACK} anchorX="center" anchorY="middle">
        Cancel
      </Text>
      {/* The default: the same button inside a heavier ring. */}
      <group position={[0.55, row, z]}>
        <mesh geometry={shapes.ring}>
          <meshBasicMaterial color={BLACK} />
        </mesh>
        <mesh geometry={down ? shapes.fill : shapes.key}>
          <meshBasicMaterial color={BLACK} />
        </mesh>
        <Text position={[0, 0, 0.001]} fontSize={0.07} color={down ? WHITE : BLACK} anchorX="center" anchorY="middle">
          {label}
        </Text>
      </group>
    </group>
  )
}

export const MAC_HEIGHT = 0.8
