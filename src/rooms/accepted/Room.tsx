import { ChapterMark } from '../../components/ChapterMark'
import { ExhibitLabel } from '../../components/ExhibitLabel'
import { RoomShell } from '../../components/RoomShell'
import { Text } from '../../components/Text'
import { WallText } from '../../components/WallText'
import { INK } from '../../identity'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { Downlight, LightPool, Luminaire } from '../../scene/Light'
import { PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { Captcha } from './artifacts/Captcha'
import { CookieBanner } from './artifacts/CookieBanner'
import { FeedEnd } from './artifacts/FeedEnd'
import { InfiniteFeed } from './artifacts/InfiniteFeed'
import { ModalStack } from './artifacts/ModalStack'
import { NotificationBadges } from './artifacts/NotificationBadges'
import { SkeletonLoader } from './artifacts/SkeletonLoader'
import { BANNER_Z, CARDS, CELLS, CHAPTERS, COMPACT_LAYOUT, OBSERVATIONS, THESIS } from './content'

const palette = PALETTES.accepted
const COOL = '#dfe6e8'
const WARM = '#f2e9d8'
const { interrupt, pause, attend, wait, feed } = CELLS

/** Short ceiling slots, deliberately out of step with each other: [x, z, width, length]. */
const SLOTS: [number, number, number, number][] = [
  // I — fragmented, harsh.
  [0.6, -2.4, 0.12, 1.6],
  [4.4, -3.6, 0.12, 2.6],
  [7.9, -1.4, 0.12, 1.1],
  [2.2, -9.6, 0.12, 1.8],
  [7.1, -11.6, 0.12, 2.4],
  [0.4, -13.4, 0.12, 1.2],
  [5.2, -15.6, 0.12, 1.4],
  // II — sparse; the badges supply the colour.
  [-1.4, -26, 0.12, 3.2],
  [5.6, -29.5, 0.12, 2.2],
  [0, -33.8, 2.4, 0.12],
]

/** Tube lights over the waiting zone: low, cool, regular, like a corridor nobody designed. */
const TUBES: [number, number][] = [
  [2.6, -37.2],
  [2.6, -40.6],
  [-0.8, -42.2],
  [-0.8, -44.6],
]

/**
 * Room 02 — Things We Somehow Accepted.
 * Unlike Room 01, nothing here waits politely on a plinth (except one badge, briefly).
 * Interface behavior is the architecture: things block the way, dim the view,
 * ask for verification and never finish loading. The room is cut into three chapters
 * — interrupt, prove / attend, wait / continue — by offset openings and a low pause,
 * so it never reads as one axis and the visitor keeps having to reorient.
 */
export function AcceptedRoom() {
  const { origin } = useRoom()

  return (
    <>
      <StaticMerge>
        <RoomShell
          {...interrupt}
          palette={palette}
          south={{ door: localDoor(DOORS.acceptedEntry, origin) }}
          north={{ door: localDoor(DOORS.interruptExit, origin) }}
        />
        <RoomShell {...pause} palette={palette} north={null} south={null} />
        {/* The CAPTCHA partition is this cell's north wall, built by the exhibit. */}
        <RoomShell {...attend} palette={palette} south={{ door: localDoor(DOORS.attendEntry, origin) }} north={null} />
        <RoomShell {...wait} palette={palette} south={null} north={{ door: localDoor(DOORS.feed, origin) }} />
        <RoomShell {...feed} palette={palette} south={null} north={{ door: localDoor(DOORS.acceptedExit, origin) }} />

        {SLOTS.map(([x, z, w, l]) => (
          <Luminaire key={`${x}:${z}`} position={[x, z > attend.maxZ ? interrupt.height - 0.004 : attend.height - 0.004, z]} size={[w, l]} palette={palette} />
        ))}
        {TUBES.map(([x, z]) => (
          <Luminaire key={`${x}:${z}`} position={[x, wait.height - 0.004, z]} size={[1.4, 0.07]} palette={palette} />
        ))}
        {/* The pause: one soft, warm panel. */}
        <Luminaire position={[1, pause.height - 0.004, -19.1]} size={[2.2, 1.6]} palette={PALETTES.entrance} />
        {/* The feed's single line gives the drifting posts something still to drift against. */}
        <Luminaire position={[0, feed.height - 0.004, (feed.minZ + feed.maxZ) / 2 + 0.4]} size={[0.06, feed.maxZ - feed.minZ - 1.6]} palette={palette} />
      </StaticMerge>

      {/* Contents by cell (interrupt 0, pause 1, attend 2, wait 3, feed 4): each drawn only while it can be seen. */}
      <RoomContents cells={[0]}>
        {/* Fragmented pools under the slots, harder and cooler than anything in Room 01. */}
        {SLOTS.slice(0, 7).map(([x, z, , l]) => (
          <LightPool key={`${x}:${z}`} position={[x, 0.004, z]} size={[1.6, l + 1.8]} color={COOL} strength={0.08} />
        ))}

        {/* I — INTERRUPT. Title and thesis on the wall the visitor turns towards. */}
        <group position={[interrupt.maxX - 0.02, 0, -6.35]} rotation={[0, -Math.PI / 2, 0]}>
          <Text position={[0, 4.55, 0]} fontSize={0.1} letterSpacing={0.14} color={INK.muted} anchorX="left" anchorY="top">
            ROOM 02
          </Text>
          <Text position={[0, 4.36, 0]} fontSize={0.42} lineHeight={1} letterSpacing={-0.03} color={INK.text} anchorX="left" anchorY="top">
            {'THINGS WE\nSOMEHOW ACCEPTED'}
          </Text>
          <Text position={[0, 3.4, 0]} fontSize={0.1} letterSpacing={0.12} color={INK.muted} anchorX="left" anchorY="top">
            ON INTERRUPTIONS THAT BECAME NORMAL
          </Text>
        </group>
        <WallText position={[interrupt.maxX - 0.02, -6.35]} facing="west" layout={COMPACT_LAYOUT} {...THESIS} />
        <Downlight at={[interrupt.maxX - 1.6, -3.2]} aim={[interrupt.maxX, 1.9, -3.2]} ceiling={interrupt.height} palette={palette} angle={0.62} penumbra={0.25} intensity={55} color={COOL} />

        <ChapterMark position={[interrupt.minX + 0.02, 3.75, -1.9]} facing="east" room="02" chapter={CHAPTERS.interrupt} />
        <ExhibitLabel position={[interrupt.minX + 0.02, 1.6, BANNER_Z + 1.55]} rotation={[0, Math.PI / 2, 0]} exhibit={CARDS.banner} />
        <ExhibitLabel position={[interrupt.minX + 0.02, 1.6, -9.6]} rotation={[0, Math.PI / 2, 0]} exhibit={CARDS.modal} />
        <CookieBanner />
        <ModalStack />
      </RoomContents>

      {/* The pause: the chapter II title, and its warm light. */}
      <RoomContents cells={[1]}>
        <LightPool position={[1, 0.004, -19.1]} size={[4.4, 3.6]} color={WARM} strength={0.1} />
        <ChapterMark position={[pause.minX + 0.25, 2.45, pause.minZ + 0.012]} facing="south" room="02" chapter={CHAPTERS.attend} width={3.1} scale={0.82} />
      </RoomContents>

      {/* II — PROVE / ATTEND. */}
      <RoomContents cells={[2]}>
        <LightPool position={[0, 0.004, -33.9]} size={[3.4, 2]} color={COOL} strength={0.1} />
        <WallText position={[attend.minX + 0.02, -22.2]} facing="east" layout={COMPACT_LAYOUT} {...OBSERVATIONS.badges} />
        <NotificationBadges />
      </RoomContents>
      {/* The CAPTCHA is the wall between II and III, seen from both. */}
      <RoomContents cells={[2, 3]}>
        <Captcha />
      </RoomContents>

      {/* III — WAIT / CONTINUE. */}
      <RoomContents cells={[3]}>
        {TUBES.map(([x, z]) => (
          <LightPool key={`${x}:${z}`} position={[x, 0.004, z]} size={[2.6, 1.6]} color={COOL} strength={0.07} />
        ))}
        <ChapterMark position={[wait.maxX - 0.02, 2.95, -38.9]} facing="west" room="02" chapter={CHAPTERS.wait} />
        <ExhibitLabel position={[wait.maxX - 0.02, 1.6, -40.6]} rotation={[0, -Math.PI / 2, 0]} exhibit={CARDS.skeleton} />
        <WallText position={[wait.minX + 0.02, -39.9]} facing="east" layout={COMPACT_LAYOUT} {...OBSERVATIONS.waiting} />
        <SkeletonLoader />
      </RoomContents>

      <RoomContents cells={[4]}>
        <InfiniteFeed />
        <FeedEnd />
      </RoomContents>
    </>
  )
}
