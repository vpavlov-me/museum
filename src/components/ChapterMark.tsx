import { Text } from '@react-three/drei'
import { facingRotation, type Facing } from './WallText'

export type Chapter = { numeral: string; name: string; line: string }

/**
 * Large chapter typography on a wall: where one idea ends and the next begins.
 * `position` is the top-left corner, room-local; reading runs to the visitor's right.
 */
export function ChapterMark({
  position,
  facing,
  room,
  chapter,
  width = 3,
  scale = 1,
}: {
  position: [number, number, number]
  facing: Facing
  room: string
  chapter: Chapter
  width?: number
  scale?: number
}) {
  return (
    <group position={position} rotation={facingRotation(facing)} scale={scale}>
      <Text fontSize={0.1} letterSpacing={0.16} color="#8f8c85" anchorX="left" anchorY="top">
        {`${room} / CHAPTER ${chapter.numeral}`}
      </Text>
      <Text position={[0, -0.2, 0]} fontSize={0.5} lineHeight={0.98} letterSpacing={-0.03} color="#efede6" anchorX="left" anchorY="top">
        {chapter.name}
      </Text>
      <Text
        position={[0, -0.32 - 0.49 * chapter.name.split('\n').length, 0]}
        fontSize={0.13}
        lineHeight={1.45}
        maxWidth={width}
        color="#bdbab2"
        anchorX="left"
        anchorY="top"
      >
        {chapter.line}
      </Text>
    </group>
  )
}
