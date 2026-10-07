import { INK, type Ink } from '../identity'
import { Text } from './Text'

/** Direction the text faces, i.e. the wall's inward normal. North is -z, the direction of travel. */
export type Facing = 'north' | 'south' | 'east' | 'west'

export const facingRotation = (facing: Facing): [number, number, number] => {
  switch (facing) {
    case 'east':
      return [0, Math.PI / 2, 0]
    case 'west':
      return [0, -Math.PI / 2, 0]
    case 'north':
      return [0, Math.PI, 0]
    default:
      return [0, 0, 0]
  }
}

export type WallTextLayout = { top: number; titleWidth: number; gap: number; bodyWidth: number }

// Two-column wall label: kicker + title on the left, essay on the right.
// Both columns hang from the same top line so the block stays near eye level.
export const WALL_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 3.2, gap: 0.45, bodyWidth: 4 }

export function WallText({
  position,
  facing,
  kicker,
  title,
  body,
  layout = WALL_LAYOUT,
  ink = INK,
}: {
  /** Where the block begins on the wall: [x, z], room-local. Reading runs to the visitor's right. */
  position: [number, number]
  facing: Facing
  kicker: string
  title: string
  body: string
  layout?: WallTextLayout
  /** Light walls take INK_ON_LIGHT. */
  ink?: Ink
}) {
  const { top, titleWidth, gap, bodyWidth } = layout

  return (
    <group position={[position[0], 0, position[1]]} rotation={facingRotation(facing)}>
      <Text position={[0, top + 0.32, 0]} fontSize={0.11} letterSpacing={0.14} color={ink.muted} anchorX="left" anchorY="top">
        {kicker}
      </Text>
      <Text
        face="display"
        position={[0, top, 0]}
        fontSize={0.46}
        lineHeight={1}
        letterSpacing={-0.005}
        maxWidth={titleWidth}
        color={ink.text}
        anchorX="left"
        anchorY="top"
      >
        {title}
      </Text>
      <Text
        position={[titleWidth + gap, top - 0.03, 0]}
        fontSize={0.155}
        lineHeight={1.55}
        maxWidth={bodyWidth}
        color={ink.body}
        anchorX="left"
        anchorY="top"
      >
        {body}
      </Text>
    </group>
  )
}
