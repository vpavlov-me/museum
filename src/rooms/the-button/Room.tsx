import { useCallback, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSound } from '../../audio/useSound'
import { Clerestory, LeafSway } from '../../components/Clerestory'
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
import { FIXTURE_MATERIAL, OAK_MATERIAL, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { ARTIFACTS } from './artifacts'
import { KeyVisual } from './KeyVisual'
import { WALNUT } from './artifacts/shared'
import { ESSAY, EXHIBITS, FREE_WALL, FREE_WALLS, type ButtonExhibit, type Chapter, type FreeWall } from './content'

const CRADLE = { height: 0.06 }
const palette = PALETTES.hall
const { minX, maxX, minZ, maxZ, height } = BUTTON_HALL

/**
 * The displays: a low oak plinth for an object you hold in the hand, a wide one for a
 * screen-sized button, a vitrine (an oak plinth under a glass hood with bronze edges) for
 * a piece of a screen, shown at a little over half size, and a frame on the wall.
 */
const DISPLAYS = {
  plinth: { width: 1, depth: 0.7, height: 1.05, scale: 1 },
  wide: { width: 2.6, depth: 0.9, height: 0.95, scale: 1 },
  vitrine: { width: 1.6, depth: 0.85, height: 0.95, scale: 0.55 },
} as const
const HOOD = { width: 1.44, height: 0.62, depth: 0.7, edge: 0.012 }
const FRAME = { width: 0.62, height: 0.8, depth: 0.05, border: 0.035, centre: 1.45 }
const GLASS = new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.1, roughness: 0.05, depthWrite: false })

/** Texts on the free-standing walls: narrower than the default block, hung a little higher. */
const CHAPTER_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 2, gap: 0.4, bodyWidth: 3.6, bodySize: 0.125 }
/** Each chapter's quote, set large above it; the prologue's runs along the hall's west wall by the entrance. */
const QUOTE = { top: 3.72, size: 0.28, width: 6 }
const ENTRANCE_QUOTE = { at: [-12 + 0.01, 15.2] as [number, number], top: 3.1, size: 0.42, width: 5.6 }

/** The clerestory: a band of frosted windows high round the hall, its only light (#48). */
const WINDOWS = { bottom: height - 2.9, top: height - 0.6 }

/** Which way is "in front" of a plinth facing this way, in room x and z. */
const FRONT: Record<ButtonExhibit['facing'], [number, number]> = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] }

function ExhibitStand({ exhibit }: { exhibit: ButtonExhibit }) {
  const [x, z] = exhibit.position
  const [fx, fz] = FRONT[exhibit.facing]
  const spec = ARTIFACTS[exhibit.artifact.kind]
  const onWall = exhibit.display === 'wall'
  const display = exhibit.display === 'wall' ? null : DISPLAYS[exhibit.display]
  const clock = useThree((state) => state.clock)
  const pressedAt = useRef(-Infinity)
  const play = useSound()
  const press = useCallback(() => {
    pressedAt.current = clock.elapsedTime
    play(spec.sound, [x, 1.1, z])
  }, [clock, play, spec.sound, x, z])

  const across = fx !== 0
  const footprint = display ? box(x, z, across ? display.depth : display.width, across ? display.width : display.depth) : null
  useObstacle(exhibit.id, footprint)
  // Pressing is optional (#48): the label is the exhibit; the button may still be pressed.
  useFocusTarget({
    id: exhibit.id,
    position: [x + fx * 0.2, onWall ? FRAME.centre : 1.3, z + fz * 0.2],
    card: exhibit,
    labelled: true,
    prompt: exhibit.artifact.prompt,
    onInteract: press,
  })

  const Artifact = spec.component
  const artifact = <Artifact label={exhibit.artifact.label} pressedAt={pressedAt} />

  return (
    <>
      <group position={[x + fx * 0.01, 0, z + fz * 0.01]} rotation={facingRotation(exhibit.facing)}>
        {display ? (
          <>
            <Plinth width={display.width} height={display.height} depth={display.depth} material={OAK_MATERIAL} />
            <group position={[0, display.height, 0]} scale={display.scale}>
              {spec.cradle !== null && <Cradle width={spec.cradle + 0.16} height={CRADLE.height} />}
              <group position={[0, (spec.cradle !== null ? CRADLE.height - CRADLE_SEAT : 0) + (spec.height ?? 0) / 2, 0]}>{artifact}</group>
            </group>
            {exhibit.display === 'vitrine' && <Hood top={display.height} />}
            <ExhibitLabel position={[-display.width / 2 + 0.14, display.height - 0.1, display.depth / 2 + 0.004]} exhibit={exhibit} width={display.width - 0.28} ink={INK} />
          </>
        ) : (
          <>
            <WallFrame />
            <group position={[0, FRAME.centre, FRAME.depth]}>{artifact}</group>
            <ExhibitLabel position={[FRAME.width / 2 + 0.3, FRAME.centre + FRAME.height / 2 - 0.05, 0.004]} exhibit={exhibit} width={0.9} ink={INK} />
          </>
        )}
      </group>
    </>
  )
}

/** A vitrine's glass hood on its plinth, its edges in dark bronze. */
function Hood({ top }: { top: number }) {
  const { width: w, height: h, depth: d, edge: e } = HOOD
  const posts: [number, number][] = [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [-w / 2, d / 2],
    [w / 2, d / 2],
  ]
  return (
    <group position={[0, top, 0]}>
      <mesh position={[0, h / 2, 0]} material={GLASS} renderOrder={2}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {posts.map(([px, pz]) => (
        <mesh key={`${px}:${pz}`} position={[px, h / 2, pz]} material={FIXTURE_MATERIAL}>
          <boxGeometry args={[e, h, e]} />
        </mesh>
      ))}
      {[-d / 2, d / 2].map((pz) => (
        <mesh key={pz} position={[0, h, pz]} material={FIXTURE_MATERIAL}>
          <boxGeometry args={[w + e, e, e]} />
        </mesh>
      ))}
      {[-w / 2, w / 2].map((px) => (
        <mesh key={px} position={[px, h, 0]} material={FIXTURE_MATERIAL}>
          <boxGeometry args={[e, e, d + e]} />
        </mesh>
      ))}
    </group>
  )
}

/** A shallow frame on the wall: bronze edges round a walnut mount. Its back is on the wall. */
function WallFrame() {
  const { width: w, height: h, depth: d, border: b, centre } = FRAME
  return (
    <group position={[0, centre, 0]}>
      <mesh position={[0, 0, d / 2 - 0.01]} material={WALNUT}>
        <boxGeometry args={[w - 2 * b, h - 2 * b, d - 0.02]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={`h${side}`} position={[0, side * (h / 2 - b / 2), d / 2]} material={FIXTURE_MATERIAL}>
          <boxGeometry args={[w, b, d]} />
        </mesh>
      ))}
      {[-1, 1].map((side) => (
        <mesh key={`v${side}`} position={[side * (w / 2 - b / 2), 0, d / 2]} material={FIXTURE_MATERIAL}>
          <boxGeometry args={[b, h - 2 * b, d]} />
        </mesh>
      ))}
    </group>
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

/**
 * A chapter of the essay on its wall: the quote set large across the top, then the
 * chapter's title and its first paragraph at eye level. The rest is in the text version.
 */
function ChapterWall({ chapter }: { chapter: Chapter }) {
  return (
    <>
      {chapter.zone !== 'P' && (
        <group position={[chapter.position[0], 0, chapter.position[1]]} rotation={facingRotation(chapter.facing)}>
          <Text face="displayItalic" position={[0, QUOTE.top, 0]} fontSize={QUOTE.size} lineHeight={1.1} maxWidth={QUOTE.width} color={INK.text} anchorX="left" anchorY="top">
            {`“${chapter.quote}”`}
          </Text>
        </group>
      )}
      <WallText position={chapter.position} facing={chapter.facing} layout={CHAPTER_LAYOUT} ink={INK} kicker={chapter.kicker} title={chapter.title} body={chapter.paragraphs[0]} />
    </>
  )
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
 * The Button (#48): one open hall straight off the lobby, 12 m high, lit by daylight from high windows.
 * The visitor sees all of it from the entrance and walks it in any order; free-standing
 * walls make its bays without closing it. Nothing has to be pressed to go on.
 */
export function TheButtonRoom() {
  const { origin } = useRoom()
  const portal = localDoor(DOORS.lobbyPermanent, origin)
  const play = useSound()
  const prologue = ESSAY[0]

  return (
    <>
      <StaticMerge>
        {/* The lobby builds its half of the shared south wall; the hall, taller, builds its own half above and beside the portal. */}
        <RoomShell minX={minX} maxX={maxX} minZ={minZ} maxZ={maxZ} height={height} palette={palette} north={{}} south={{ door: portal, split: true }} />
        {FREE_WALLS.map((wall, i) => (
          <FreeWallBody key={i} wall={wall} />
        ))}
        <Clerestory minX={minX} maxX={maxX} minZ={minZ} maxZ={maxZ} bottom={WINDOWS.bottom} top={WINDOWS.top} />
      </StaticMerge>
      {FREE_WALLS.map((wall, i) => (
        <FreeWallObstacle key={i} wall={wall} index={i} />
      ))}

      <RoomContents>
        <LeafSway />
        {/* The prologue: the exhibition's title over its first chapter, on the wall the visitor meets first. */}
        <group position={[prologue.position[0], 0, prologue.position[1]]}>
          <Text position={[0, 3.86, 0]} fontSize={TYPE.kicker} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            EXHIBITION 01 / A SMALL HISTORY OF DIGITAL AFFORDANCE
          </Text>
          <Text face="display" position={[0, 3.7, 0]} fontSize={0.5} letterSpacing={-0.01} color={INK.text} anchorX="left" anchorY="top">
            The Button
          </Text>
        </group>
        {/* Its quote, large, on the long wall to the left of the entrance. */}
        <group position={[ENTRANCE_QUOTE.at[0], 0, ENTRANCE_QUOTE.at[1]]} rotation={facingRotation('east')}>
          <Text face="displayItalic" position={[0, ENTRANCE_QUOTE.top, 0]} fontSize={ENTRANCE_QUOTE.size} lineHeight={1.1} maxWidth={ENTRANCE_QUOTE.width} color={INK.text} anchorX="left" anchorY="top">
            {`“${prologue.quote}”`}
          </Text>
        </group>

        {ESSAY.map((chapter) => (
          <ChapterWall key={chapter.id} chapter={chapter} />
        ))}

        <KeyVisual />

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
          leaf="oak"
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
