import { useState } from 'react'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, held, type ArtifactProps } from './shared'

const TINT = '#007aff'
const TINT_PRESSED = '#a6cdfb'

/**
 * 2013. An iOS 7 navigation bar: a title and two buttons that are only words in the tint
 * colour, over a hairline. A press fades the word, as a touch did.
 */
export function Word({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const [down, setDown] = useState(false)
  useRoomFrame(({ clock }) => {
    const now = held(pressedAt, clock.elapsedTime, 0.35) === 1
    if (now !== down) setDown(now)
  })

  const z = 0.011
  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.02]} />
        <meshBasicMaterial color="#f8f8f7" />
      </mesh>
      <mesh position={[0, -height / 2 + 0.06, z]}>
        <planeGeometry args={[width, 0.004]} />
        <meshBasicMaterial color="#c8c7cc" />
      </mesh>
      <Text position={[-0.82, 0.02, z]} fontSize={0.1} color={TINT} anchorX="left" anchorY="middle">
        Cancel
      </Text>
      <Text position={[0, 0.02, z]} fontSize={0.1} color="#0a0a0a" anchorX="center" anchorY="middle">
        New Event
      </Text>
      <Text position={[0.82, 0.02, z]} fontSize={0.1} color={down ? TINT_PRESSED : TINT} anchorX="right" anchorY="middle">
        {label}
      </Text>
    </group>
  )
}
