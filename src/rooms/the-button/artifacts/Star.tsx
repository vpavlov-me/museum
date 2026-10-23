import { useMemo, useState } from 'react'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { BUTTON, held, type ArtifactProps } from './shared'

const PAPER = '#ecebe4'
const INK = '#141414'
const COMMAND = { width: 0.5, height: 0.2, line: 0.012 }

/**
 * 1981. A strip of the Star's screen, white like paper: commands as rectangles with a word
 * inside, nothing more. A press selects the first by turning it black.
 */
export function Star({ label, pressedAt }: ArtifactProps) {
  const { width, height } = BUTTON
  const [selected, setSelected] = useState(false)
  useRoomFrame(({ clock }) => {
    const now = held(pressedAt, clock.elapsedTime, 0.6) === 1
    if (now !== selected) setSelected(now)
  })

  const commands = useMemo(() => [label, 'Cancel', 'Defaults'], [label])
  const z = 0.012
  return (
    <group>
      <mesh>
        <boxGeometry args={[width, height, 0.02]} />
        <meshBasicMaterial color={PAPER} />
      </mesh>
      {commands.map((word, i) => {
        const x = -0.6 + i * 0.6
        const fill = i === 0 && selected
        return (
          <group key={word} position={[x, 0, z]}>
            <mesh>
              <planeGeometry args={[COMMAND.width, COMMAND.height]} />
              <meshBasicMaterial color={INK} />
            </mesh>
            <mesh position={[0, 0, 0.001]} visible={!fill}>
              <planeGeometry args={[COMMAND.width - 2 * COMMAND.line, COMMAND.height - 2 * COMMAND.line]} />
              <meshBasicMaterial color={PAPER} />
            </mesh>
            <Text position={[0, 0, 0.002]} fontSize={0.075} color={fill ? PAPER : INK} anchorX="center" anchorY="middle">
              {word}
            </Text>
          </group>
        )
      })}
    </group>
  )
}
