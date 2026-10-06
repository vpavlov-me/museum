import { useSound } from '../../audio/useSound'
import { DoorLeaf } from '../../components/DoorLeaf'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { INK, MUSEUM, TYPE } from '../../identity'
import { navigation } from '../../museum/navigation'
import { COLOPHON } from '../../museum/roomRegistry'
import { RoomContents } from '../../museum/RoomContext'
import type { ExhibitCardData } from '../../museum/types'
import { LightPool, Luminaire } from '../../scene/Light'
import { PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'

const palette = PALETTES.entrance
const WALL = COLOPHON.minZ + 0.02
const TEXT_X = COLOPHON.minX + 0.5
const EXIT_X = COLOPHON.maxX - 1.4
const WARM = '#efe6d6'

const CARD: ExhibitCardData = {
  index: 'END',
  year: MUSEUM.year,
  category: 'PERMANENT EXHIBITION',
  title: 'The end of the permanent exhibition',
  description: `Three rooms, conceived and built by ${MUSEUM.author}. The door ahead leads back to the lobby, and to the museum's other exhibitions.`,
}

const ROOMS = MUSEUM.rooms.map(([number, title]) => `${number}   ${title}`).join('\n')
/** The credit line sits under the list of rooms, however long it is. */
const CREDITS_Y = 1.55 - MUSEUM.rooms.length * 0.075 * 1.7 - 0.13

/**
 * After the last room, a colophon: a low, warm room in the entrance's palette, so the
 * exhibition closes the way it opened. The credits are on the wall; the door beside
 * them leads back to the lobby.
 */
export function Colophon() {
  const play = useSound()

  return (
    <>
      <StaticMerge>
        {/* SUCCESS, taller, builds the shared wall and its doorway. */}
        <RoomShell {...COLOPHON} palette={palette} south={null} north={{}} />
        <Luminaire position={[(COLOPHON.minX + COLOPHON.maxX) / 2, COLOPHON.height - 0.004, COLOPHON.minZ + 1.6]} size={[4.4, 0.12]} palette={palette} />
      </StaticMerge>

      <RoomContents>
        <LightPool position={[(COLOPHON.minX + COLOPHON.maxX) / 2, 0.004, COLOPHON.minZ + 1.8]} size={[6, 3]} color={WARM} strength={0.08} />
        <LightPool position={[TEXT_X + 1.6, 1.7, WALL - 0.008]} rotation={[0, 0, 0]} size={[4.6, 3]} color={WARM} strength={0.06} />

        <group position={[TEXT_X, 0, WALL]}>
          <Text position={[0, 2.62, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            END OF THE PERMANENT EXHIBITION
          </Text>
          <Text position={[0, 2.46, 0]} fontSize={0.3} letterSpacing={-0.02} color={INK.text} anchorX="left" anchorY="top">
            Thank you for visiting.
          </Text>
          <Text position={[0, 2.0, 0]} fontSize={0.085} lineHeight={1.55} maxWidth={3.3} color={INK.body} anchorX="left" anchorY="top">
            The permanent exhibition is three rooms about the interfaces we use every day without noticing them.
          </Text>
          <Text position={[0, 1.55, 0]} fontSize={0.075} lineHeight={1.7} color={INK.body} anchorX="left" anchorY="top">
            {ROOMS}
          </Text>
          <Text position={[0, CREDITS_Y, 0]} fontSize={0.06} letterSpacing={0.06} lineHeight={1.6} maxWidth={3.3} color={INK.muted} anchorX="left" anchorY="top">
            {`Conceived, written, designed and built by ${MUSEUM.author}, ${MUSEUM.year}.`}
          </Text>
        </group>

        <DoorLeaf
          id="permanent-return"
          x={EXIT_X}
          wall={WALL}
          palette={palette}
          sign="LOBBY"
          prompt="RETURN TO THE LOBBY"
          card={CARD}
          onUse={() => {
            play('exit-door', [EXIT_X, 1.2, WALL])
            navigation.returnToLobby('permanent')
          }}
        />
      </RoomContents>
    </>
  )
}
