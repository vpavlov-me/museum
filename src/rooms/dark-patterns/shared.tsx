import { useMemo } from 'react'
import { Text } from '../../components/Text'
import { WallMount } from '../../components/WallMount'
import { facingRotation, type Facing } from '../../components/WallText'
import { INK, TYPE } from '../../identity'
import { useFocusTarget } from '../../scene/Interaction'
import { roundedRect } from '../../scene/geometry'
import { basicMaterial } from '../../scene/materials'
import { cardOf, SALES, type Pattern } from './content'

/**
 * A screen on a wall, in the shop's voice: a title, a line, a large friendly button
 * and a small grey way out. Self-lit, like a screen, in a bronze wall mount. `position`
 * is its centre on the wall, room-local; it faces `facing`.
 */
export function Screen({
  position,
  facing,
  width = 2.4,
  height = 1.5,
  title,
  body,
  primary,
  secondary,
  urgent,
}: {
  position: [number, number, number]
  facing: Facing
  width?: number
  height?: number
  title: string
  body?: string
  primary?: string
  secondary?: string
  /** A line in red: a countdown, a deadline. */
  urgent?: string
}) {
  const left = -width / 2 + 0.16
  const inner = width - 0.32
  return (
    <group position={position} rotation={facingRotation(facing)}>
      <WallMount width={width} height={height}>
        <mesh material={basicMaterial(SALES.surface)}>
          <planeGeometry args={[width, height]} />
        </mesh>
        <Text position={[left, height / 2 - 0.16, 0.003]} fontSize={0.12} lineHeight={1.15} maxWidth={inner} color={SALES.ink} anchorX="left" anchorY="top">
          {title}
        </Text>
        {urgent && (
          <Text position={[left, height / 2 - 0.5, 0.003]} fontSize={0.2} letterSpacing={0.02} color={SALES.urgent} anchorX="left" anchorY="top">
            {urgent}
          </Text>
        )}
        {body && (
          <Text position={[left, urgent ? -0.05 : height / 2 - 0.5, 0.003]} fontSize={0.06} lineHeight={1.45} maxWidth={inner} color={SALES.ink} anchorX="left" anchorY="top">
            {body}
          </Text>
        )}
        {primary && (
          <group position={[left + 0.6, -height / 2 + 0.24, 0.003]}>
            <mesh geometry={roundedRect(1.2, 0.2, 0.1)} material={basicMaterial(SALES.button)} />
            <Text position={[0, 0, 0.002]} fontSize={0.055} letterSpacing={0.04} color="#ffffff" anchorX="center" anchorY="middle">
              {primary}
            </Text>
          </group>
        )}
        {secondary && (
          <Text position={[left + 1.36, -height / 2 + 0.24, 0.003]} fontSize={0.032} color={SALES.quiet} anchorX="left" anchorY="middle">
            {secondary}
          </Text>
        )}
      </WallMount>
    </group>
  )
}

/**
 * The museum's own voice in this exhibition: a small gallery label that names a
 * pattern and says plainly what it does. `position` is its top-left corner, room-local.
 */
export function PatternLabel({ position, facing, pattern, width = 1.5 }: { position: [number, number, number]; facing: Facing; pattern: Pattern; width?: number }) {
  const card = useMemo(() => cardOf(pattern), [pattern])
  const rotation = facingRotation(facing)
  // Focus is on the label's middle, a little out from the wall.
  const out = facing === 'south' ? [0, 1] : facing === 'north' ? [0, -1] : facing === 'east' ? [1, 0] : [-1, 0]
  const along = facing === 'south' ? [1, 0] : facing === 'north' ? [-1, 0] : facing === 'east' ? [0, -1] : [0, 1]
  useFocusTarget({
    id: `pattern-${pattern.id}`,
    position: [position[0] + along[0] * (width / 2) + out[0] * 0.3, 1.4, position[2] + along[1] * (width / 2) + out[1] * 0.3],
    distance: 2.6,
    facing: 0.6,
    card,
    labelled: true,
  })

  return (
    <group position={position} rotation={rotation}>
      <Text fontSize={TYPE.labelMeta} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
        {pattern.also ? `PATTERN / ${pattern.also.toUpperCase()}` : 'PATTERN'}
      </Text>
      <Text position={[0, -0.075, 0]} fontSize={0.1} letterSpacing={-0.01} color={INK.text} anchorX="left" anchorY="top">
        {pattern.name}
      </Text>
      <Text position={[0, -0.22, 0]} fontSize={0.05} lineHeight={1.5} maxWidth={width} color={INK.body} anchorX="left" anchorY="top">
        {pattern.text}
      </Text>
    </group>
  )
}
