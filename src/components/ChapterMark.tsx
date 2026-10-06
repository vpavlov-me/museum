import type { MutableRefObject } from 'react'
import type * as THREE from 'three'
import { INK } from '../identity'
import { Text } from './Text'
import { facingRotation, type Facing } from './WallText'

export type Chapter = { numeral: string; name: string; line: string }

/** A troika text mesh whose opacity can be animated without re-rendering. */
export type FadingText = THREE.Mesh & { fillOpacity: number }

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
  lineClip,
  texts,
}: {
  position: [number, number, number]
  facing: Facing
  room: string
  chapter: Chapter
  width?: number
  scale?: number
  /** Clips the line to [minX, minY, maxX, maxY], text-local (y runs down from 0). */
  lineClip?: [number, number, number, number]
  /** Receives the three text meshes (kicker, name, line), e.g. to fade them. */
  texts?: MutableRefObject<(FadingText | null)[]>
}) {
  const keep = (i: number) => (node: FadingText | null) => {
    if (texts) texts.current[i] = node
  }

  return (
    <group position={position} rotation={facingRotation(facing)} scale={scale}>
      <Text ref={keep(0)} fontSize={0.1} letterSpacing={0.16} color={INK.muted} anchorX="left" anchorY="top">
        {`${room} / CHAPTER ${chapter.numeral}`}
      </Text>
      <Text ref={keep(1)} position={[0, -0.2, 0]} fontSize={0.5} lineHeight={0.98} letterSpacing={-0.03} color={INK.text} anchorX="left" anchorY="top">
        {chapter.name}
      </Text>
      <Text
        ref={keep(2)}
        clipRect={lineClip}
        position={[0, -0.32 - 0.49 * chapter.name.split('\n').length, 0]}
        fontSize={0.13}
        lineHeight={1.45}
        maxWidth={width}
        color={INK.body}
        anchorX="left"
        anchorY="top"
      >
        {chapter.line}
      </Text>
    </group>
  )
}
