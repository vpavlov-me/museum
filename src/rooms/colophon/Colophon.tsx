import { useSound } from '../../audio/useSound'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { INK, MUSEUM, TYPE } from '../../identity'
import { COLOPHON } from '../../museum/roomRegistry'
import { RoomContents } from '../../museum/RoomContext'
import { museumStore } from '../../museum/store'
import type { ExhibitCardData } from '../../museum/types'
import { useFocusTarget } from '../../scene/Interaction'
import { LightPool, Luminaire } from '../../scene/Light'
import { basicMaterial, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'

const palette = PALETTES.entrance
const WALL = COLOPHON.minZ + 0.02
const TEXT_X = COLOPHON.minX + 0.5
const EXIT = { x: COLOPHON.maxX - 1.4, width: 1.2, height: 2.3 }
const WARM = '#efe6d6'

const CARD: ExhibitCardData = {
  index: 'EXIT',
  year: MUSEUM.year,
  category: 'COLOPHON',
  title: 'Thank you for visiting',
  description: `The end of the exhibition. ${MUSEUM.name}, in three rooms, conceived and built by ${MUSEUM.author}. The door ahead leaves the museum.`,
}

const ROOMS = MUSEUM.rooms.map(([number, title]) => `${number}   ${title}`).join('\n')

/**
 * After the last room, a colophon: a low, warm room in the entrance's palette, so the
 * visit closes the way it opened. The credits are on the wall; the door beside them
 * is the way out. Leaving ends the visit and hands over to the 2D colophon.
 */
export function Colophon() {
  const play = useSound()
  useFocusTarget({
    id: 'exit',
    position: [EXIT.x, 1.3, WALL],
    distance: 3,
    facing: 0.6,
    card: CARD,
    labelled: true,
    prompt: 'LEAVE THE MUSEUM',
    onInteract: () => {
      play('exit-door', [EXIT.x, 1.2, WALL])
      museumStore.set({ ended: true })
    },
  })

  return (
    <>
      <StaticMerge>
        {/* SUCCESS, taller, builds the shared wall and its doorway. */}
        <RoomShell {...COLOPHON} palette={palette} south={null} north={{}} />
        <Luminaire position={[(COLOPHON.minX + COLOPHON.maxX) / 2, COLOPHON.height - 0.004, COLOPHON.minZ + 1.6]} size={[4.4, 0.12]} palette={palette} />

        {/* The way out: a plain door with a lit sign over it. */}
        <group position={[EXIT.x, 0, WALL]}>
          <mesh position={[0, EXIT.height / 2, 0]} material={PALETTES.passage.floor}>
            <planeGeometry args={[EXIT.width, EXIT.height]} />
          </mesh>
          {[-1, 1].map((side) => (
            <mesh key={side} position={[side * (EXIT.width / 2 + 0.03), EXIT.height / 2, 0.015]} material={palette.reveal}>
              <boxGeometry args={[0.06, EXIT.height, 0.03]} />
            </mesh>
          ))}
          <mesh position={[0, EXIT.height + 0.03, 0.015]} material={palette.reveal}>
            <boxGeometry args={[EXIT.width + 0.12, 0.06, 0.03]} />
          </mesh>
          <mesh position={[EXIT.width / 2 - 0.22, 1.05, 0.006]} material={palette.reveal}>
            <boxGeometry args={[0.3, 0.035, 0.012]} />
          </mesh>
          <mesh position={[0, EXIT.height + 0.3, 0.004]} material={basicMaterial('#1a1918')}>
            <planeGeometry args={[0.5, 0.17]} />
          </mesh>
        </group>
      </StaticMerge>

      <RoomContents>
        <LightPool position={[(COLOPHON.minX + COLOPHON.maxX) / 2, 0.004, COLOPHON.minZ + 1.8]} size={[6, 3]} color={WARM} strength={0.08} />
        <LightPool position={[TEXT_X + 1.6, 1.7, WALL - 0.008]} rotation={[0, 0, 0]} size={[4.6, 3]} color={WARM} strength={0.06} />

        <group position={[TEXT_X, 0, WALL]}>
          <Text position={[0, 2.62, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            END OF EXHIBITION
          </Text>
          <Text position={[0, 2.46, 0]} fontSize={0.3} letterSpacing={-0.02} color={INK.text} anchorX="left" anchorY="top">
            Thank you for visiting.
          </Text>
          <Text position={[0, 2.0, 0]} fontSize={0.085} lineHeight={1.55} maxWidth={3.3} color={INK.body} anchorX="left" anchorY="top">
            {`${MUSEUM.name} is an exhibition in three rooms about the interfaces we use every day without noticing them.`}
          </Text>
          <Text position={[0, 1.55, 0]} fontSize={0.075} lineHeight={1.7} color={INK.body} anchorX="left" anchorY="top">
            {ROOMS}
          </Text>
          <Text position={[0, 1.05, 0]} fontSize={0.06} letterSpacing={0.06} lineHeight={1.6} maxWidth={3.3} color={INK.muted} anchorX="left" anchorY="top">
            {`Conceived, written, designed and built by ${MUSEUM.author}, ${MUSEUM.year}.`}
          </Text>
        </group>

        <Text position={[EXIT.x, EXIT.height + 0.3, WALL + 0.006]} fontSize={0.075} letterSpacing={0.24} color={INK.text} anchorX="center" anchorY="middle">
          EXIT
        </Text>
      </RoomContents>
    </>
  )
}
