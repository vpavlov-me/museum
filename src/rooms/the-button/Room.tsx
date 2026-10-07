import { useCallback, useRef, type ComponentType } from 'react'
import { useThree } from '@react-three/fiber'
import type { SoundName } from '../../audio/sounds'
import { useSound } from '../../audio/useSound'
import { Cradle, CRADLE_SEAT } from '../../components/Cradle'
import { DoorSign } from '../../components/DoorSign'
import { ExhibitLabel } from '../../components/ExhibitLabel'
import { Plinth } from '../../components/Plinth'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { WallText } from '../../components/WallText'
import { INK } from '../../identity'
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
const CRADLE = { height: 0.06 }
const palette = PALETTES.gallery

/** Each era answers a press in its own material: a hard clack, a soft gel, a dry tick, almost nothing. */
const PRESS_SOUNDS: Record<ArtifactStyle, SoundName> = {
  bevel: 'button-bevel',
  gloss: 'button-gloss',
  flat: 'button-flat',
  quiet: 'button-quiet',
}

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
  const play = useSound()
  const press = useCallback(() => {
    pressedAt.current = clock.elapsedTime
    play(PRESS_SOUNDS[exhibit.artifact.style], [x, PLINTH.height + 0.1, z])
  }, [clock, play, exhibit.artifact.style, x, z])

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

        {/* Each button stands in a cradle on its plinth, as an object, not an image. */}
        <group position={[0, PLINTH.height, 0]}>
          <Cradle width={BUTTON.width + 0.16} height={CRADLE.height} />
        </group>
        <group position={[0, PLINTH.height + CRADLE.height - CRADLE_SEAT + BUTTON.height / 2, 0]}>
          <Artifact label={exhibit.artifact.label} pressedAt={pressedAt} />
        </group>

        <ExhibitLabel position={[-PLINTH.width / 2 + 0.14, PLINTH.height - 0.1, PLINTH.depth / 2 + 0.004]} exhibit={exhibit} width={1.7} />
      </group>
    </>
  )
}

export function TheButtonRoom() {
  const { origin } = useRoom()
  const exit = localDoor(DOORS.buttonExit, origin)
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
          north={{ door: exit }}
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
        <LightPool position={[0, 3.4, -halfLength + 0.012]} rotation={[0, 0, 0]} size={[11, 5]} strength={0.07} />

        <Text face="display" position={[0, 4.3, -halfLength + 0.02]} fontSize={1.2} letterSpacing={-0.01} color={INK.text} anchorX="center" anchorY="middle">
          The Button
        </Text>
        <Text position={[0, 3.55, -halfLength + 0.02]} fontSize={0.17} letterSpacing={0.12} color={INK.muted} anchorX="center" anchorY="middle">
          ROOM 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
        </Text>

        {/* Where the exit leads, over it. */}
        <DoorSign position={[exit.center, exit.height, -halfLength + 0.02]} facing="south" kicker="NEXT · ROOM 02" title="Things We Somehow Accepted" />

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
