import { useCallback, useRef, type ComponentType } from 'react'
import { useThree } from '@react-three/fiber'
import type { SoundName } from '../../audio/sounds'
import { useSound } from '../../audio/useSound'
import { Cradle, CRADLE_SEAT } from '../../components/Cradle'
import { DoorLeaf } from '../../components/DoorLeaf'
import { ExhibitLabel } from '../../components/ExhibitLabel'
import { Plinth } from '../../components/Plinth'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { facingRotation, WallText, type WallTextLayout } from '../../components/WallText'
import { INK_ON_LIGHT as INK, MUSEUM, TYPE } from '../../identity'
import { navigation } from '../../museum/navigation'
import { BUTTON_HALL, DOORS, localDoor } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { box } from '../../museum/types'
import { useObstacle } from '../../scene/Collision'
import { useFocusTarget } from '../../scene/Interaction'
import { Downlight, Luminaire } from '../../scene/Light'
import { OAK_MATERIAL, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { FlatButton } from './artifacts/FlatButton'
import { QuietButton } from './artifacts/QuietButton'
import { RaisedButton } from './artifacts/RaisedButton'
import { BUTTON, type ArtifactProps } from './artifacts/shared'
import { TactileButton } from './artifacts/TactileButton'
import { EXHIBITS, FREE_WALL, FREE_WALLS, WALL_TEXTS, type ArtifactStyle, type ButtonExhibit, type FreeWall } from './content'

const PLINTH = { width: 2.6, height: 0.95, depth: 0.9 }
const CRADLE = { height: 0.06 }
const palette = PALETTES.hall
const { minX, maxX, minZ, maxZ, height } = BUTTON_HALL

/** Texts on the free-standing walls: narrower than the default block, hung a little higher. */
const WALL_TEXT_LAYOUT: WallTextLayout = { top: 2.7, titleWidth: 2.2, gap: 0.35, bodyWidth: 3.6 }
/** The prologue hangs a little lower, under the exhibition's title. */
const PROLOGUE_LAYOUT: WallTextLayout = { ...WALL_TEXT_LAYOUT, top: 2.55 }

/** The laylights: square panels on a grid across the whole ceiling, the hall's even daylight. */
const LAYLIGHT = { size: 2.4, pitch: 3.2 }
const laylights = (() => {
  const panels: [number, number][] = []
  for (let x = minX + LAYLIGHT.pitch * 0.75; x < maxX - 1; x += LAYLIGHT.pitch) {
    for (let z = minZ + LAYLIGHT.pitch * 0.75; z < maxZ - 1; z += LAYLIGHT.pitch) panels.push([x, z])
  }
  return panels
})()

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

/** Which way is "in front" of a plinth facing this way, in room x and z. */
const FRONT: Record<ButtonExhibit['facing'], [number, number]> = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] }

function ExhibitStand({ exhibit }: { exhibit: ButtonExhibit }) {
  const [x, z] = exhibit.position
  const [fx, fz] = FRONT[exhibit.facing]
  const clock = useThree((state) => state.clock)
  const pressedAt = useRef(-Infinity)
  const play = useSound()
  const press = useCallback(() => {
    pressedAt.current = clock.elapsedTime
    play(PRESS_SOUNDS[exhibit.artifact.style], [x, PLINTH.height + 0.1, z])
  }, [clock, play, exhibit.artifact.style, x, z])

  const across = fx !== 0
  useObstacle(exhibit.id, box(x, z, across ? PLINTH.depth : PLINTH.width, across ? PLINTH.width : PLINTH.depth))
  // Pressing is optional (#48): the label is the exhibit; the button may still be pressed.
  useFocusTarget({
    id: exhibit.id,
    position: [x, 1.3, z],
    card: exhibit,
    labelled: true,
    prompt: exhibit.artifact.prompt,
    onInteract: press,
  })

  const Artifact = ARTIFACTS[exhibit.artifact.style]

  return (
    <>
      {/* Lit from in front, so the face of the artifact catches the light. */}
      <Downlight at={[x + fx * 1.7, z + fz * 1.7]} aim={[x, 1.1, z]} ceiling={height} palette={palette} angle={0.3} penumbra={0.8} intensity={90} distance={12} />
      <group position={[x, 0, z]} rotation={facingRotation(exhibit.facing)}>
        <Plinth width={PLINTH.width} height={PLINTH.height} depth={PLINTH.depth} material={OAK_MATERIAL} />

        {/* Each button stands in a cradle on its plinth, as an object, not an image. */}
        <group position={[0, PLINTH.height, 0]}>
          <Cradle width={BUTTON.width + 0.16} height={CRADLE.height} />
        </group>
        <group position={[0, PLINTH.height + CRADLE.height - CRADLE_SEAT + BUTTON.height / 2, 0]}>
          <Artifact label={exhibit.artifact.label} pressedAt={pressedAt} />
        </group>

        <ExhibitLabel position={[-PLINTH.width / 2 + 0.14, PLINTH.height - 0.1, PLINTH.depth / 2 + 0.004]} exhibit={exhibit} width={1.7} ink={INK} />
      </group>
    </>
  )
}

/**
 * A free-standing wall: plaster, floating on a shadow gap like the hall's own walls, with
 * a clean top. It stands 4 m high in a 7 m hall, so the hall above it stays one space.
 */
function FreeWallBody({ wall }: { wall: FreeWall }) {
  const length = wall.to - wall.from
  const mid = (wall.from + wall.to) / 2
  const gap = 0.035
  const [x, z] = wall.axis === 'x' ? [mid, wall.at] : [wall.at, mid]
  const [sx, sz] = wall.axis === 'x' ? [length, FREE_WALL.thickness] : [FREE_WALL.thickness, length]
  return (
    <>
      <mesh position={[x, gap + (FREE_WALL.height - gap) / 2, z]} material={palette.wall}>
        <boxGeometry args={[sx, FREE_WALL.height - gap, sz]} />
      </mesh>
      <mesh position={[x, gap / 2, z]} material={palette.skirting}>
        <boxGeometry args={[Math.max(0.01, sx - 0.024), gap, Math.max(0.01, sz - 0.024)]} />
      </mesh>
    </>
  )
}

function FreeWallObstacle({ wall, index }: { wall: FreeWall; index: number }) {
  const length = wall.to - wall.from
  const mid = (wall.from + wall.to) / 2
  useObstacle(`free-wall-${index}`, wall.axis === 'x' ? box(mid, wall.at, length, FREE_WALL.thickness) : box(wall.at, mid, FREE_WALL.thickness, length))
  return null
}

/** The end of the exhibition: a door back to the lobby, in the epilogue's corner of the hall's south wall. */
const RETURN_X = 8.5
const RETURN_CARD = {
  index: 'END',
  year: MUSEUM.year,
  category: 'PERMANENT EXHIBITION',
  title: 'Back to the lobby',
  description: 'The end of the permanent exhibition, for now. The door leads back to the lobby.',
}

/**
 * The Button (#48): one open hall straight off the lobby, under a ceiling of laylights.
 * The visitor sees all of it from the entrance and walks it in any order; free-standing
 * walls make its bays without closing it. Nothing has to be pressed to go on.
 */
export function TheButtonRoom() {
  const { origin } = useRoom()
  const portal = localDoor(DOORS.lobbyPermanent, origin)
  const play = useSound()
  const prologue = WALL_TEXTS[0]

  return (
    <>
      <StaticMerge>
        {/* The lobby builds its half of the shared south wall; the hall, taller, builds its own half above and beside the portal. */}
        <RoomShell minX={minX} maxX={maxX} minZ={minZ} maxZ={maxZ} height={height} palette={palette} north={{}} south={{ door: portal, split: true }} />
        {FREE_WALLS.map((wall, i) => (
          <FreeWallBody key={i} wall={wall} />
        ))}
        {laylights.map(([x, z]) => (
          <Luminaire key={`${x}:${z}`} position={[x, height - 0.004, z]} size={[LAYLIGHT.size, LAYLIGHT.size]} palette={palette} />
        ))}
      </StaticMerge>
      {FREE_WALLS.map((wall, i) => (
        <FreeWallObstacle key={i} wall={wall} index={i} />
      ))}

      <RoomContents>
        {/* The prologue: the room's title over its first text, on the wall the visitor meets first. */}
        <group position={[prologue.position[0], 0, prologue.position[1]]}>
          <Text position={[0, 3.86, 0]} fontSize={TYPE.kicker} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            EXHIBITION 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
          </Text>
          <Text face="display" position={[0, 3.7, 0]} fontSize={0.5} letterSpacing={-0.01} color={INK.text} anchorX="left" anchorY="top">
            The Button
          </Text>
        </group>

        {WALL_TEXTS.map((text) => (
          <WallText key={text.id} position={text.position} facing={text.facing} layout={text === prologue ? PROLOGUE_LAYOUT : WALL_TEXT_LAYOUT} ink={INK} kicker={text.kicker} title={text.title} body={text.body} />
        ))}

        {EXHIBITS.map((exhibit) => (
          <ExhibitStand key={exhibit.id} exhibit={exhibit} />
        ))}

        <DoorLeaf
          id="permanent-return"
          x={RETURN_X}
          wall={maxZ - 0.02}
          facing="north"
          palette={palette}
          sign="LOBBY"
          prompt="RETURN TO THE LOBBY"
          card={RETURN_CARD}
          onUse={() => {
            play('exit-door', [RETURN_X, 1.2, maxZ])
            navigation.returnToLobby('permanent')
          }}
        />
      </RoomContents>
    </>
  )
}
