import { Text } from '@react-three/drei'
import { RoomShell } from '../../components/RoomShell'
import { WallText } from '../../components/WallText'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { useRoom } from '../../museum/RoomContext'
import { Captcha } from './artifacts/Captcha'
import { ClosedPassage } from './artifacts/ClosedPassage'
import { CookieBanner } from './artifacts/CookieBanner'
import { InfiniteFeed } from './artifacts/InfiniteFeed'
import { ModalStack } from './artifacts/ModalStack'
import { NotificationBadges } from './artifacts/NotificationBadges'
import { SkeletonLoader } from './artifacts/SkeletonLoader'
import { COMPACT_LAYOUT, FEED, HALL, OBSERVATIONS, THESIS } from './content'

/**
 * Room 02 — Things We Somehow Accepted.
 * Unlike Room 01, nothing here waits politely on a plinth (except one badge, briefly).
 * Interface behavior is the architecture: things block the way, dim the view,
 * ask for verification and never finish loading.
 */
export function AcceptedRoom() {
  const { origin } = useRoom()

  return (
    <>
      <RoomShell
        {...HALL}
        north={{ door: localDoor(DOORS.feed, origin) }}
        south={{ color: '#2e2d2b', door: localDoor(DOORS.acceptedEntry, origin) }}
      />
      <RoomShell {...FEED} wallColor="#2b2a28" north={{}} south={null} />

      {/* Title on the east wall of the vestibule, facing the thesis. */}
      <group position={[HALL.maxX - 0.02, 0, 8.7]} rotation={[0, -Math.PI / 2, 0]}>
        <Text position={[0, 3.78, 0]} fontSize={0.1} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
          ROOM 02
        </Text>
        <Text position={[0, 3.55, 0]} fontSize={0.5} lineHeight={1} letterSpacing={-0.03} color="#efede6" anchorX="left" anchorY="top">
          {'THINGS WE\nSOMEHOW ACCEPTED'}
        </Text>
        <Text position={[0, 2.38, 0]} fontSize={0.1} letterSpacing={0.12} color="#8f8c85" anchorX="left" anchorY="top">
          ON INTERRUPTIONS THAT BECAME NORMAL
        </Text>
      </group>

      <WallText position={[HALL.minX + 0.02, 14.75]} facing="east" layout={COMPACT_LAYOUT} {...THESIS} />
      <WallText position={[HALL.minX + 0.02, 7.4]} facing="east" layout={COMPACT_LAYOUT} {...OBSERVATIONS.badges} />
      <WallText position={[HALL.maxX - 0.02, -14.75]} facing="west" layout={COMPACT_LAYOUT} {...OBSERVATIONS.waiting} />

      <CookieBanner />
      <NotificationBadges />
      <ModalStack />
      <Captcha />
      <SkeletonLoader />
      <InfiniteFeed />
      <ClosedPassage />

      <pointLight position={[0, 3.6, 12]} intensity={8} distance={9} color="#efe6d6" />
      <pointLight position={[0, 3.6, -11.5]} intensity={6} distance={8} color="#efe6d6" />
    </>
  )
}
