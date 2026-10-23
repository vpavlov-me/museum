import { useSound } from '../../audio/useSound'
import { ChapterWall } from '../../components/ChapterWall'
import { Clerestory, LeafSway } from '../../components/Clerestory'
import { DoorLeaf } from '../../components/DoorLeaf'
import { FreeWallBodies, FreeWallObstacles } from '../../components/FreeWall'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { INK_ON_LIGHT as INK, MUSEUM, TYPE } from '../../identity'
import { navigation } from '../../museum/navigation'
import { ACCEPTED_HALL, DOORS, localDoor } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { Badges } from './artifacts/Badges'
import { Captcha } from './artifacts/Captcha'
import { CookieBanner } from './artifacts/CookieBanner'
import { Feed } from './artifacts/Feed'
import { ModalStack } from './artifacts/ModalStack'
import { Skeletons } from './artifacts/Skeleton'
import { ESSAY, FREE_WALLS, LAYOUT } from './content'

const palette = PALETTES.hall
const { minX, maxX, minZ, maxZ, height } = ACCEPTED_HALL
const WINDOWS = { bottom: height - 2.9, top: height - 0.6 }

const RETURN_CARD = {
  index: 'END',
  year: MUSEUM.year,
  category: 'PERMANENT EXHIBITION',
  title: 'Back to the lobby',
  description: 'The end of the permanent exhibition, for now. The door leads back to the lobby.',
}

/**
 * Room 02, Things We Somehow Accepted (v4, #55): a hall like The Button's, north of it
 * through a wide portal. Its exhibits are the interface habits that began as compromises:
 * a banner overhead, dialogs on a plinth, a wall of badges, a CAPTCHA, skeleton screens,
 * and the feed rising through the middle of the hall. Nothing stands in the way; what
 * once blocked the visitor in Room 02 can now be looked at, and pressed if wanted.
 */
export function AcceptedRoom() {
  const { origin } = useRoom()
  const portal = localDoor(DOORS.buttonAccepted, origin)
  const play = useSound()
  const prologue = ESSAY[0]
  const back = LAYOUT.returnDoor

  return (
    <>
      <StaticMerge>
        {/* The Button builds its half of the shared wall with the portal; this hall builds the other half. */}
        <RoomShell minX={minX} maxX={maxX} minZ={minZ} maxZ={maxZ} height={height} palette={palette} north={{}} south={{ door: portal, split: true }} />
        <FreeWallBodies walls={FREE_WALLS} palette={palette} />
        <Clerestory minX={minX} maxX={maxX} minZ={minZ} maxZ={maxZ} bottom={WINDOWS.bottom} top={WINDOWS.top} />
      </StaticMerge>
      <FreeWallObstacles walls={FREE_WALLS} />

      <RoomContents>
        <LeafSway />
        {/* The prologue: the room's title over its first chapter, on the wall to the left of the portal. */}
        <group position={[prologue.position[0], 0, prologue.position[1]]}>
          <Text position={[0, 3.86, 0]} fontSize={TYPE.kicker} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
            ROOM 02 / ON INTERRUPTIONS THAT BECAME NORMAL
          </Text>
          <Text face="display" position={[0, 3.72, 0]} fontSize={0.42} lineHeight={0.95} letterSpacing={-0.01} maxWidth={6.6} color={INK.text} anchorX="left" anchorY="top">
            Things We Somehow Accepted
          </Text>
        </group>
        {ESSAY.map((chapter) => (
          <ChapterWall key={chapter.id} chapter={chapter} quote={chapter.zone !== 'P'} />
        ))}

        <CookieBanner />
        <ModalStack />
        <Badges />
        <Captcha />
        <Skeletons />
        <Feed />

        <DoorLeaf
          id="accepted-return"
          x={back}
          wall={maxZ - 0.02}
          facing="north"
          palette={palette}
          sign="LOBBY"
          leaf="oak"
          prompt="RETURN TO THE LOBBY"
          card={RETURN_CARD}
          onUse={() => {
            play('exit-door', [back, 1.2, maxZ])
            navigation.returnToLobby('permanent')
          }}
        />
      </RoomContents>
    </>
  )
}
