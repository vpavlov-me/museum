import { INK } from '../identity'
import type { ExhibitCardData } from '../museum/types'
import { Text } from './Text'

/**
 * A gallery label set directly on a surface: index and year, title, a short text.
 * The group origin is the label's top-left corner; it reads along local +x.
 */
export function ExhibitLabel({
  position,
  rotation,
  exhibit,
  width = 1.1,
  scale = 1,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  exhibit: ExhibitCardData
  width?: number
  scale?: number
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Text fontSize={0.042} letterSpacing={0.14} color={INK.muted} anchorX="left" anchorY="top">
        {`${exhibit.index} / ${exhibit.year} / ${exhibit.category}`}
      </Text>
      <Text face="display" position={[0, -0.08, 0]} fontSize={0.1} maxWidth={width} color={INK.text} anchorX="left" anchorY="top">
        {exhibit.title}
      </Text>
      <Text position={[0, -0.225, 0]} fontSize={0.042} lineHeight={1.5} maxWidth={width} color={INK.body} anchorX="left" anchorY="top">
        {exhibit.description}
      </Text>
    </group>
  )
}
