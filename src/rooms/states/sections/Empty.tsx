import { Text } from '@react-three/drei'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight, LightPool, Luminaire } from '../../../scene/Light'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { roundedRect } from '../../../scene/geometry'
import { CARDS, CELLS, CHAPTERS, CTA_LABEL, INK } from '../content'

const cell = CELLS.empty
const palette = PALETTES.empty
const CENTER_X = (cell.minX + cell.maxX) / 2
const WALL = cell.minZ + 0.02
const CTA = { y: 1.18, width: 0.6, height: 0.13 }

/**
 * II — EMPTY. After two dense rooms, the largest and barest volume in the museum:
 * one soft light, one wall, a short sentence, and a primary action at the scale of
 * a light switch. Nothing else. The emptiness is the exhibit.
 */
export function EmptyState() {
  useFocusTarget({ id: 'empty', position: [CENTER_X, CTA.y, WALL], distance: 4.2, facing: 0.6, card: CARDS.empty, labelled: true })

  return (
    <>
      <StaticMerge>
        <Luminaire position={[CENTER_X, cell.height - 0.004, (cell.minZ + cell.maxZ) / 2 + 1]} size={[4.6, 4.6]} palette={palette} />
      </StaticMerge>
      <LightPool position={[CENTER_X, 0.004, (cell.minZ + cell.maxZ) / 2 + 1]} size={[11, 11]} color="#e9e4d9" strength={0.05} />

      <group position={[CENTER_X, 0, WALL]}>
        <Text position={[0, 2.42, 0]} fontSize={0.075} letterSpacing={0.16} color={INK.muted} anchorX="center" anchorY="middle">
          {`03 / CHAPTER ${CHAPTERS.empty.numeral}`}
        </Text>
        <Text position={[0, 2.24, 0]} fontSize={0.3} letterSpacing={-0.02} color={INK.text} anchorX="center" anchorY="top">
          {CHAPTERS.empty.name}
        </Text>
        <Text position={[0, 1.8, 0]} fontSize={0.085} lineHeight={1.5} maxWidth={3.1} textAlign="center" color={INK.body} anchorX="center" anchorY="top">
          {CHAPTERS.empty.line}
        </Text>

        {/* The primary action, at the scale of a light switch on an 18-metre wall. */}
        <mesh position={[0, CTA.y, 0]} geometry={roundedRect(CTA.width, CTA.height, CTA.height / 2)} material={basicMaterial(INK.text)} />
        <Text position={[0, CTA.y, 0.002]} fontSize={0.034} color={INK.dark} anchorX="center" anchorY="middle">
          {`+  ${CTA_LABEL}`}
        </Text>
      </group>
      <Downlight at={[CENTER_X, cell.minZ + 2.2]} aim={[CENTER_X, 1.6, cell.minZ]} ceiling={cell.height} palette={palette} angle={0.3} penumbra={0.65} intensity={150} distance={14} />
    </>
  )
}
