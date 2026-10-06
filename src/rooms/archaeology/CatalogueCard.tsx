import { Text } from '../../components/Text'
import { basicMaterial } from '../../scene/materials'
import { ARCHIVE, type Find } from './content'

const PAD = 0.05

/**
 * The archive's voice: a catalogue card, dark ink on pale stock, with the find's
 * accession number, its layer, its name and the archive's reading of it. The group
 * origin is the card's centre; it faces local +z.
 */
export function CatalogueCard({
  position,
  rotation,
  find,
  width = 0.8,
  height = 0.46,
  note,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  find: Find
  width?: number
  height?: number
  /** A last line, set apart: the archive's running remarks. */
  note?: string
}) {
  const left = -width / 2 + PAD
  const top = height / 2 - PAD
  const inner = width - 2 * PAD

  return (
    <group position={position} rotation={rotation}>
      <mesh material={basicMaterial(ARCHIVE.card)}>
        <planeGeometry args={[width, height]} />
      </mesh>
      <Text position={[left, top, 0.002]} fontSize={0.022} letterSpacing={0.14} color={ARCHIVE.inkMuted} anchorX="left" anchorY="top">
        {`${find.accession}   ${find.layer}`}
      </Text>
      <Text position={[left, top - 0.05, 0.002]} fontSize={0.05} letterSpacing={-0.01} maxWidth={inner} color={ARCHIVE.ink} anchorX="left" anchorY="top">
        {find.name}
      </Text>
      <Text position={[left, top - 0.13, 0.002]} fontSize={0.027} lineHeight={1.45} maxWidth={inner} color={ARCHIVE.ink} anchorX="left" anchorY="top">
        {find.reading}
      </Text>
      {note && (
        <Text position={[left, -height / 2 + PAD, 0.002]} fontSize={0.022} letterSpacing={0.1} color={ARCHIVE.inkMuted} anchorX="left" anchorY="bottom">
          {note}
        </Text>
      )}
    </group>
  )
}
