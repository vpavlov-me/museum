import { useCallback, useRef, type ComponentType } from 'react'
import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { ExhibitLabel } from '../../components/ExhibitLabel'
import { Plinth } from '../../components/Plinth'
import { RoomShell } from '../../components/RoomShell'
import { WallText } from '../../components/WallText'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { useRoom } from '../../museum/RoomContext'
import { box } from '../../museum/types'
import { useObstacle } from '../../scene/Collision'
import { useFocusTarget } from '../../scene/Interaction'
import { FlatButton } from './artifacts/FlatButton'
import { QuietButton } from './artifacts/QuietButton'
import { RaisedButton } from './artifacts/RaisedButton'
import { BUTTON, type ArtifactProps } from './artifacts/shared'
import { TactileButton } from './artifacts/TactileButton'
import { EXHIBITS, ROOM, THRESHOLDS, WALL_TEXTS, type ArtifactStyle, type ButtonExhibit } from './content'

const PLINTH = { width: 2.6, height: 0.95, depth: 0.9 }

const ARTIFACTS: Record<ArtifactStyle, ComponentType<ArtifactProps>> = {
  bevel: RaisedButton,
  gloss: TactileButton,
  flat: FlatButton,
  quiet: QuietButton,
}

function ExhibitStand({ exhibit }: { exhibit: ButtonExhibit }) {
  const [x, z] = exhibit.position
  const clock = useThree((state) => state.clock)
  const pressedAt = useRef(-Infinity)
  const press = useCallback(() => {
    pressedAt.current = clock.elapsedTime
  }, [clock])

  // Plinths are rotated to face the aisle, so their long side runs along z.
  useObstacle(exhibit.id, box(x, z, PLINTH.depth, PLINTH.width))
  useFocusTarget({
    id: exhibit.id,
    position: [x, 1.3, z],
    card: exhibit,
    prompt: exhibit.artifact.prompt,
    onInteract: press,
  })

  const Artifact = ARTIFACTS[exhibit.artifact.style]

  return (
    <group position={[x, 0, z]} rotation={[0, exhibit.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
      <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} />

      <group position={[0, PLINTH.height + BUTTON.height / 2 + 0.02, 0]}>
        <Artifact label={exhibit.artifact.label} pressedAt={pressedAt} />
      </group>

      <ExhibitLabel position={[-PLINTH.width / 2 + 0.12, PLINTH.height - 0.14, PLINTH.depth / 2 + 0.005]}>
        {`${exhibit.index} / ${exhibit.year}`}
      </ExhibitLabel>

      <pointLight position={[0, 3.4, 1.2]} intensity={9} distance={6} color="#efe6d6" />
    </group>
  )
}

export function TheButtonRoom() {
  const { origin } = useRoom()
  const { halfWidth, halfLength, height } = ROOM

  return (
    <>
      <RoomShell
        minX={-halfWidth}
        maxX={halfWidth}
        minZ={-halfLength}
        maxZ={halfLength}
        height={height}
        north={{ door: localDoor(DOORS.buttonExit, origin) }}
        south={{ color: '#2e2d2b', door: localDoor(DOORS.entrance, origin) }}
      />

      {THRESHOLDS.map((z) => (
        <mesh key={z} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[halfWidth * 2 - 3, 0.025]} />
          <meshBasicMaterial color="#303030" />
        </mesh>
      ))}

      <Text position={[0, 3.3, -halfLength + 0.02]} fontSize={1.05} letterSpacing={-0.04} color="#efede6" anchorX="center" anchorY="middle">
        THE BUTTON
      </Text>
      <Text position={[0, 2.45, -halfLength + 0.02]} fontSize={0.17} letterSpacing={0.12} color="#8f8c85" anchorX="center" anchorY="middle">
        ROOM 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
      </Text>
      <pointLight position={[0, 3.6, -10.5]} intensity={12} distance={9} color="#efe6d6" />

      {/* Directional sign beside the exit. */}
      <Text position={[-4.45, 1.75, -halfLength + 0.02]} fontSize={0.075} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
        {'←  NEXT\n02 / THINGS WE SOMEHOW ACCEPTED'}
      </Text>

      {WALL_TEXTS.map((text) => (
        <WallText key={text.id} position={text.position} facing={text.facing} kicker={text.kicker} title={text.title} body={text.body} />
      ))}

      {EXHIBITS.map((exhibit) => (
        <ExhibitStand key={exhibit.id} exhibit={exhibit} />
      ))}
    </>
  )
}
