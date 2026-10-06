import { useRef } from 'react'
import type { FadingText } from '../../../components/ChapterMark'
import { Text } from '../../../components/Text'
import { INK } from '../../../identity'
import { DOORS } from '../../../museum/roomRegistry'
import { useRoom, useRoomFrame } from '../../../museum/RoomContext'
import { Downlight } from '../../../scene/Light'
import { PALETTES } from '../../../scene/materials'
import { FEED } from '../content'
import { smoothstep } from '../shared'

/**
 * The end of the feed: no last post, only a door, and above it the line every feed
 * eventually offers. Beyond it a low, dark passage leads on to Room 03.
 */
export function FeedEnd() {
  const wall = FEED.minZ + 0.01
  const { origin } = useRoom()
  const texts = useRef<(FadingText | null)[]>([])
  const keep = (i: number) => (node: FadingText | null) => {
    texts.current[i] = node
  }
  const lintel = DOORS.acceptedExit.height

  // The message only resolves once you are close: from the far end of the feed it stays a dim shape.
  useRoomFrame(({ camera }) => {
    const distance = Math.abs(camera.position.z - (origin[1] + FEED.minZ))
    const opacity = 0.15 + 0.85 * smoothstep(10, 5, distance)
    texts.current.forEach((text) => {
      if (text) text.fillOpacity = opacity
    })
  })

  return (
    <>
      <group position={[0, 0, wall]}>
        <Text ref={keep(0)} position={[0, lintel + 0.42, 0]} fontSize={0.045} letterSpacing={0.16} color={INK.muted} anchorX="center" anchorY="middle">
          END OF FEED
        </Text>
        <Text ref={keep(1)} position={[0, lintel + 0.24, 0]} fontSize={0.12} color={INK.text} anchorX="center" anchorY="middle">
          You're all caught up.
        </Text>
      </group>

      {/* The only warm light in the room: the museum's own voice, at the end of the feed. */}
      <Downlight at={[0, FEED.minZ + 1.6]} aim={[0, 2.2, FEED.minZ]} ceiling={FEED.height} palette={PALETTES.accepted} angle={0.55} penumbra={0.7} intensity={14} />
    </>
  )
}
