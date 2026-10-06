import { useCallback, useRef, type ComponentType } from 'react'
import { Text } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { ExhibitLabel } from '../../components/ExhibitLabel'
import { Plinth } from '../../components/Plinth'
import { RoomShell } from '../../components/RoomShell'
import { WallText } from '../../components/WallText'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { box } from '../../museum/types'
import { useObstacle } from '../../scene/Collision'
import { useFocusTarget } from '../../scene/Interaction'
import { Downlight, LightPool, Luminaire } from '../../scene/Light'
import { basicMaterial, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { FlatButton } from './artifacts/FlatButton'
import { QuietButton } from './artifacts/QuietButton'
import { RaisedButton } from './artifacts/RaisedButton'
import { BUTTON, type ArtifactProps } from './artifacts/shared'
import { TactileButton } from './artifacts/TactileButton'
import { EXHIBITS, ROOM, THRESHOLDS, WALL_TEXTS, type ArtifactStyle, type ButtonExhibit } from './content'

const PLINTH = { width: 2.6, height: 0.95, depth: 0.9 }
const palette = PALETTES.gallery

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
    labelled: true,
    prompt: exhibit.artifact.prompt,
    onInteract: press,
  })

  const Artifact = ARTIFACTS[exhibit.artifact.style]
  // Lit from the aisle side, so the face of the artifact catches the light.
  const aisle = exhibit.side === 'left' ? 1 : -1

  return (
    <>
      <Downlight at={[x + aisle * 1.7, z]} aim={[x, 1.1, z]} ceiling={ROOM.height} palette={palette} angle={0.36} penumbra={0.8} intensity={70} />
      <group position={[x, 0, z]} rotation={[0, exhibit.side === 'left' ? Math.PI / 2 : -Math.PI / 2, 0]}>
        <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} />

        <group position={[0, PLINTH.height + BUTTON.height / 2 + 0.02, 0]}>
          <Artifact label={exhibit.artifact.label} pressedAt={pressedAt} />
        </group>

        <ExhibitLabel position={[-PLINTH.width / 2 + 0.14, PLINTH.height - 0.1, PLINTH.depth / 2 + 0.004]} exhibit={exhibit} width={1.7} />
      </group>
    </>
  )
}

export function TheButtonRoom() {
  const { origin } = useRoom()
  const { halfWidth, halfLength, height } = ROOM

  return (
    <>
      <StaticMerge>
        <RoomShell
          minX={-halfWidth}
          maxX={halfWidth}
          minZ={-halfLength}
          maxZ={halfLength}
          height={height}
          palette={palette}
          north={{ door: localDoor(DOORS.buttonExit, origin) }}
          south={{ door: localDoor(DOORS.entrance, origin) }}
        />

        {THRESHOLDS.map((z) => (
          <mesh key={z} position={[0, 0.002, z]} rotation={[-Math.PI / 2, 0, 0]} material={basicMaterial('#3a3836')}>
            <planeGeometry args={[halfWidth * 2 - 3, 0.025]} />
          </mesh>
        ))}

        {/* Wall-washer slots along both long walls: the gallery's even, quiet light. */}
        {[-1, 1].map((side) => (
          <Luminaire key={side} position={[side * (halfWidth - 0.45), height - 0.004, 0]} size={[0.14, halfLength * 2 - 1.6]} palette={palette} />
        ))}
      </StaticMerge>

      <RoomContents>
        {/* The title wall is washed from below the ceiling, not by a lamp you can find. */}
        <LightPool position={[0, 3, -halfLength + 0.012]} rotation={[0, 0, 0]} size={[11, 5]} strength={0.07} />

        <Text position={[0, 3.3, -halfLength + 0.02]} fontSize={1.05} letterSpacing={-0.04} color="#efede6" anchorX="center" anchorY="middle">
          THE BUTTON
        </Text>
        <Text position={[0, 2.45, -halfLength + 0.02]} fontSize={0.17} letterSpacing={0.12} color="#8f8c85" anchorX="center" anchorY="middle">
          ROOM 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
        </Text>

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
      </RoomContents>
    </>
  )
}
