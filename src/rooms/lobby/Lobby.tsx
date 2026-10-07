import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useSound } from '../../audio/useSound'
import { DoorLeaf } from '../../components/DoorLeaf'
import { LobbyPlan } from './LobbyPlan'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { Wall } from '../../components/Wall'
import { WallText, type WallTextLayout } from '../../components/WallText'
import { INK_ON_LIGHT as INK, MUSEUM, TYPE } from '../../identity'
import { motion } from '../../museum/capabilities'
import { exhibitions, useExhibitionStatus } from '../../museum/exhibitionLoader'
import { EXHIBITIONS, type ExhibitionDefinition } from '../../museum/exhibitions'
import { navigation } from '../../museum/navigation'
import { DOORS, LOBBY, WALL_THICKNESS } from '../../museum/roomRegistry'
import { RoomContents, useRoomFrame } from '../../museum/RoomContext'
import { useMuseumStore } from '../../museum/store'
import { rect } from '../../museum/types'
import { useObstacle } from '../../scene/Collision'
import { useFocusTarget } from '../../scene/Interaction'
import { LightPool, Luminaire } from '../../scene/Light'
import { basicMaterial, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'

/*
 * The lobby: where every visit starts and ends. Bright, plain and compact. Its north
 * wall holds the museum's three entrances, each signed beside its door: the permanent
 * exhibition straight ahead (START HERE, and a line on the floor leading to it),
 * Interface Archaeology to the right, the temporary exhibition (Dark Patterns) to the
 * left. The front door, the credits and how to visit are behind the visitor.
 *
 * An exhibition's door stays shut until its rooms have loaded; walking towards it is
 * what starts loading them. World coordinates (the lobby's origin is the world origin).
 */

const palette = PALETTES.lobby
const t = WALL_THICKNESS
const NORTH = LOBBY.minZ + 0.02
const SOUTH = LOBBY.maxZ - 0.02
const CENTER_Z = (LOBBY.minZ + LOBBY.maxZ) / 2
const LEAF = new THREE.MeshStandardMaterial({ color: '#615d57', roughness: 0.9 })
/** Walking this close to an entrance starts loading its exhibition. */
const APPROACH = 6.5
const OPEN_SECONDS = 1.1
/** The front door, in the south wall, behind the visitor as they arrive. */
const EXIT_X = -3

const DOOR_OF: Partial<Record<ExhibitionDefinition['id'], keyof typeof DOORS>> = {
  permanent: 'lobbyPermanent',
  archaeology: 'lobbyArchaeology',
  'dark-patterns': 'lobbyDark',
}

/*
 * The classical order of the hall, in light stone: engaged columns (pilasters) on the
 * walls, a cornice all round, and a coffered ceiling whose coffers are the laylights.
 * All of it stays within a pilaster's depth of the walls: nothing stands in the way.
 */
const PILASTER = { width: 0.52, depth: 0.2, base: 0.3, capital: 0.26 }
const CORNICE = { height: 0.32, depth: 0.16 }
const BEAM = { width: 0.32, depth: 0.34 }
/** Between the entrances and their signs on the north wall; clear of the front door and credits on the south. */
const PILASTERS_NORTH = [-12.2, -3.6, 7.6]
const PILASTERS_SOUTH = [-9.4, 1.2, 6.4, 11.6]

/** A pilaster against a wall face at `wall` (z), standing into the room towards `into` (+1 south, -1 north). */
function Pilaster({ x, wall, into }: { x: number; wall: number; into: 1 | -1 }) {
  const z = (depth: number) => wall + (into * depth) / 2
  const shaft = LOBBY.height - CORNICE.height - PILASTER.base - PILASTER.capital
  return (
    <>
      <mesh position={[x, PILASTER.base / 2, z(PILASTER.depth + 0.08)]} material={palette.trim}>
        <boxGeometry args={[PILASTER.width + 0.12, PILASTER.base, PILASTER.depth + 0.08]} />
      </mesh>
      <mesh position={[x, PILASTER.base + shaft / 2, z(PILASTER.depth)]} material={palette.trim}>
        <boxGeometry args={[PILASTER.width, shaft, PILASTER.depth]} />
      </mesh>
      <mesh position={[x, PILASTER.base + shaft + PILASTER.capital / 2, z(PILASTER.depth + 0.07)]} material={palette.trim}>
        <boxGeometry args={[PILASTER.width + 0.14, PILASTER.capital, PILASTER.depth + 0.07]} />
      </mesh>
    </>
  )
}

/** Cornice, pilasters and coffers: the lobby's order. */
function Order() {
  const top = LOBBY.height - CORNICE.height / 2
  const width = LOBBY.maxX - LOBBY.minX
  const length = LOBBY.maxZ - LOBBY.minZ
  return (
    <>
      {/* Cornice: a band of stone under the ceiling, all the way round. */}
      {[LOBBY.minZ + CORNICE.depth / 2, LOBBY.maxZ - CORNICE.depth / 2].map((z) => (
        <mesh key={`cz${z}`} position={[(LOBBY.minX + LOBBY.maxX) / 2, top, z]} material={palette.trim}>
          <boxGeometry args={[width, CORNICE.height, CORNICE.depth]} />
        </mesh>
      ))}
      {[LOBBY.minX + CORNICE.depth / 2, LOBBY.maxX - CORNICE.depth / 2].map((x) => (
        <mesh key={`cx${x}`} position={[x, top, (LOBBY.minZ + LOBBY.maxZ) / 2]} material={palette.trim}>
          <boxGeometry args={[CORNICE.depth, CORNICE.height, length]} />
        </mesh>
      ))}

      {PILASTERS_NORTH.map((x) => <Pilaster key={`n${x}`} x={x} wall={LOBBY.minZ} into={1} />)}
      {PILASTERS_SOUTH.map((x) => <Pilaster key={`s${x}`} x={x} wall={LOBBY.maxZ} into={-1} />)}

      {/* Coffers: beams between the laylights, across and along the hall. */}
      {[-12, -5, 1, 7, 13].map((x) => (
        <mesh key={`bx${x}`} position={[x, LOBBY.height - BEAM.depth / 2, (LOBBY.minZ + LOBBY.maxZ) / 2]} material={palette.trim}>
          <boxGeometry args={[BEAM.width, BEAM.depth, length]} />
        </mesh>
      ))}
      <mesh position={[(LOBBY.minX + LOBBY.maxX) / 2, LOBBY.height - BEAM.depth / 2, 31]} material={palette.trim}>
        <boxGeometry args={[width, BEAM.depth, BEAM.width]} />
      </mesh>
    </>
  )
}

const STATEMENT_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 3, gap: 0.45, bodyWidth: 3.6 }

const VISIT = [
  ['W A S D', 'Walk'],
  ['Mouse', 'Look'],
  ['E', 'Interact, when an object invites it'],
  ['P', 'Plan of the museum'],
  ['Esc', 'Pause and release the cursor'],
]

const cardOf = (exhibition: ExhibitionDefinition) => ({
  index: exhibition.number,
  year: exhibition.status === 'open' ? 'OPEN' : 'IN PREPARATION',
  category: 'EXHIBITION',
  title: exhibition.title,
  description: exhibition.subtitle,
})

/** An exhibition's name beside its door: number, title, one line, and its state. */
function Sign({ exhibition, x }: { exhibition: ExhibitionDefinition; x: number }) {
  const visited = useMuseumStore((state) => state.visited.includes(exhibition.id))
  const status = useExhibitionStatus(exhibition.id)
  const state =
    exhibition.status !== 'open'
      ? 'IN PREPARATION'
      : status === 'open'
        ? exhibition.recommended === 1
          ? 'OPEN  ·  START HERE'
          : 'OPEN'
        : status === 'idle'
          ? 'OPEN'
          : 'OPENING…'

  return (
    <group position={[x, 0, NORTH]}>
      <Text position={[0, 2.62, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
        {`${exhibition.kind === 'temporary' ? 'TEMPORARY EXHIBITION' : 'EXHIBITION'} ${exhibition.number}  ↑`}
      </Text>
      <Text face="display" position={[0, 2.44, 0]} fontSize={0.3} lineHeight={1} maxWidth={2.5} color={INK.text} anchorX="left" anchorY="top">
        {exhibition.title}
      </Text>
      <Text position={[0, 1.86, 0]} fontSize={0.075} lineHeight={1.5} maxWidth={2.4} color={INK.body} anchorX="left" anchorY="top">
        {exhibition.subtitle}
      </Text>
      <Text position={[0, 1.5, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.text} anchorX="left" anchorY="top">
        {visited ? `${state}  ·  VISITED` : state}
      </Text>
    </group>
  )
}

/** An exhibition's entrance: shut until its rooms are ready, then the leaf slides into the wall. */
function Entrance({ exhibition }: { exhibition: ExhibitionDefinition }) {
  const key = DOOR_OF[exhibition.id]!
  const door = DOORS[key]
  const status = useExhibitionStatus(exhibition.id)
  const open = status === 'open'
  const leaf = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const play = useSound()

  // The door is heard sliding open, once, where it is.
  useEffect(() => {
    if (open) play('lobby-door', [door.x, 1.4, door.z])
  }, [open, play, door.x, door.z])

  useObstacle(`${exhibition.id}-door`, open ? null : rect(door.x - door.width / 2, door.x + door.width / 2, door.z - 0.2, door.z + 0.2))
  useFocusTarget({ id: `${exhibition.id}-entrance`, position: [door.x, 1.4, NORTH], distance: 4, facing: 0.6, card: cardOf(exhibition), labelled: true })

  useRoomFrame(({ camera }, delta) => {
    if (status === 'idle' && Math.hypot(camera.position.x - door.x, camera.position.z - door.z) < APPROACH) exhibitions.request(exhibition.id)
    const mesh = leaf.current
    if (!mesh || (open && progress.current >= 1) || (!open && progress.current <= 0)) return
    // With less motion asked for, the door is simply open.
    const step = motion.reduced ? 1 : delta / OPEN_SECONDS
    progress.current = THREE.MathUtils.clamp(progress.current + (open ? step : -step), 0, 1)
    const eased = THREE.MathUtils.smoothstep(progress.current, 0, 1)
    mesh.position.x = door.x - eased * (door.width - 0.05)
  })

  return (
    <>
      <mesh ref={leaf} position={[door.x, door.height / 2, door.z]} material={LEAF}>
        <boxGeometry args={[door.width, door.height, 0.06]} />
      </mesh>
      {!open && status !== 'idle' && (
        <Text position={[door.x, 1.6, door.z + 0.035]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.text} anchorX="center" anchorY="middle">
          OPENING…
        </Text>
      )}
      <Sign exhibition={exhibition} x={door.x + door.width / 2 + 0.45} />
    </>
  )
}

/** An exhibition not open yet: a door that stays shut, with its sign. */
function ClosedEntrance({ exhibition }: { exhibition: ExhibitionDefinition }) {
  const width = 1.8
  const height = 2.6
  useFocusTarget({ id: `${exhibition.id}-entrance`, position: [exhibition.door, 1.4, NORTH], distance: 4, facing: 0.6, card: cardOf(exhibition), labelled: true })
  return (
    <>
      <StaticMerge>
        <mesh position={[exhibition.door, height / 2, NORTH + 0.002]} material={LEAF}>
          <planeGeometry args={[width, height]} />
        </mesh>
        {[-1, 1].map((side) => (
          <mesh key={side} position={[exhibition.door + side * (width / 2 + 0.03), height / 2, NORTH + 0.015]} material={palette.reveal}>
            <boxGeometry args={[0.06, height, 0.03]} />
          </mesh>
        ))}
        <mesh position={[exhibition.door, height + 0.03, NORTH + 0.015]} material={palette.reveal}>
          <boxGeometry args={[width + 0.12, 0.06, 0.03]} />
        </mesh>
      </StaticMerge>
      <Sign exhibition={exhibition} x={exhibition.door + width / 2 + 0.45} />
    </>
  )
}

export function Lobby() {
  const play = useSound()
  const dark = DOORS.lobbyDark
  const permanent = DOORS.lobbyPermanent
  const archaeology = DOORS.lobbyArchaeology
  const west = (dark.x + permanent.x) / 2
  const east = (permanent.x + archaeology.x) / 2
  const opening = (door: typeof dark) => ({ center: door.x, width: door.width, height: door.height })

  return (
    <>
      <StaticMerge>
        {/* The north wall has three openings, so the lobby builds it in three lengths. */}
        <RoomShell {...LOBBY} palette={palette} north={null} south={{}} />
        <Wall axis="x" at={LOBBY.minZ - t / 2} from={LOBBY.minX - t} to={west} height={LOBBY.height} palette={palette} door={opening(dark)} />
        <Wall axis="x" at={LOBBY.minZ - t / 2} from={west} to={east} height={LOBBY.height} palette={palette} door={opening(permanent)} />
        <Wall axis="x" at={LOBBY.minZ - t / 2} from={east} to={LOBBY.maxX + t} height={LOBBY.height} palette={palette} door={opening(archaeology)} />

        <Order />

        {/* A laylight over the whole lobby: the brightest, most even light before the galleries. */}
        {[-9, -3, 3, 9].map((x) =>
          [28.6, 33.4].map((z) => <Luminaire key={`${x}:${z}`} position={[x + 1, LOBBY.height - 0.004, z]} size={[3.6, 2.8]} palette={palette} />),
        )}

        {/* The recommended route, on the floor: from the front door to the permanent exhibition. */}
        <mesh position={[0, 0.003, (LOBBY.minZ + 33.6) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={basicMaterial('#57544e')}>
          <planeGeometry args={[0.025, 33.6 - LOBBY.minZ]} />
        </mesh>
      </StaticMerge>

      <RoomContents>
        <LightPool position={[1, 0.004, CENTER_Z]} size={[26, 9]} color="#efe6d6" strength={0.02} />

        <Text face="display" position={[permanent.x, 4.22, NORTH]} fontSize={0.66} letterSpacing={-0.005} color={INK.text} anchorX="center" anchorY="middle">
          {MUSEUM.name}
        </Text>
        <Text position={[permanent.x, 3.72, NORTH]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="center" anchorY="middle">
          LOBBY
        </Text>
        <Text position={[0.16, 0.006, 33.2]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.11} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="middle">
          START HERE ↑
        </Text>

        {EXHIBITIONS.map((exhibition) =>
          exhibition.status === 'open' ? <Entrance key={exhibition.id} exhibition={exhibition} /> : <ClosedEntrance key={exhibition.id} exhibition={exhibition} />,
        )}

        <WallText
          position={[LOBBY.maxX - 0.02, 33.8]}
          facing="west"
          layout={STATEMENT_LAYOUT}
          ink={INK}
          kicker="INTERFACE MUSEUM"
          title="Interfaces, given physical form."
          body="A small museum about the controls, conventions and habits we use every day without noticing them. The permanent exhibition starts straight ahead; Interface Archaeology is on the right, and the temporary exhibition on the left. Each exhibition ends at a door back to this lobby."
        />

        {/* The plan on the wall, beside how to visit. */}
        <LobbyPlan position={[LOBBY.minX + 0.03, 1.75, 29.4]} />

        {/* How to visit: a quiet gallery label, not a menu. */}
        <group position={[LOBBY.minX + 0.02, 0, 33.6]} rotation={[0, Math.PI / 2, 0]}>
          <Text position={[0, 2.5, 0]} fontSize={TYPE.kicker} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            HOW TO VISIT
          </Text>
          {/* Two columns, one text each: keys, and what they do. */}
          <Text position={[0, 2.18, 0]} fontSize={0.13} lineHeight={2.3} color={INK.text} anchorX="left" anchorY="top">
            {VISIT.map(([key]) => key).join('\n')}
          </Text>
          <Text position={[1.05, 2.18, 0]} fontSize={0.13} lineHeight={2.3} color={INK.body} anchorX="left" anchorY="top">
            {VISIT.map(([, action]) => action).join('\n')}
          </Text>
        </group>

        {/* Behind the visitor: the front door, and the credits beside it. */}
        <DoorLeaf
          id="museum-exit"
          x={EXIT_X}
          wall={SOUTH}
          facing="north"
          palette={palette}
          sign="EXIT"
          prompt="LEAVE THE MUSEUM"
          card={{ index: 'EXIT', year: MUSEUM.year, category: 'INTERFACE MUSEUM', title: 'Leave the museum', description: 'The front door. Leaving ends the visit.' }}
          onUse={() => {
            play('exit-door', [EXIT_X, 1.2, SOUTH])
            navigation.leave()
          }}
        />
        <group position={[EXIT_X - 1.4, 0, SOUTH]} rotation={[0, Math.PI, 0]}>
          <Text position={[0, 2.3, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            {MUSEUM.name.toUpperCase()}
          </Text>
          <Text position={[0, 2.1, 0]} fontSize={0.085} lineHeight={1.55} maxWidth={3.1} color={INK.body} anchorX="left" anchorY="top">
            {`${MUSEUM.premise} Conceived, written, designed and built by ${MUSEUM.author}, ${MUSEUM.year}. Set in Inter by Rasmus Andersson.`}
          </Text>
        </group>
      </RoomContents>
    </>
  )
}
