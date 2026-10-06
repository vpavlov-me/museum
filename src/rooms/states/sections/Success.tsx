import { Text } from '../../../components/Text'
import { useFocusTarget } from '../../../scene/Interaction'
import { Luminaire } from '../../../scene/Light'
import { PALETTES } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { CARDS, CELLS, CHAPTERS, INK } from '../content'

const cell = CELLS.success
const palette = PALETTES.success
const CENTER_X = (cell.minX + cell.maxX) / 2
const WALL = cell.minZ + 0.02

/**
 * V — SUCCESS. After the dark, low OFFLINE room: the tallest, brightest space in the
 * museum, with almost nothing in it. Completion is communicated by height, light
 * and quiet, not by celebration. Under the one word, a low doorway leads on to
 * the passage to Room 04.
 */
export function SuccessState() {
  useFocusTarget({ id: 'success', position: [CENTER_X, 3, WALL], distance: 10, facing: 0.8, card: CARDS.success, labelled: true })

  return (
    <>
      {/* A laylight over the whole room: even, bright, without a single visible lamp. */}
      <StaticMerge>
        {[-1, 0, 1].flatMap((i) =>
          [-1, 0, 1].map((j) => (
            <Luminaire key={`${i}:${j}`} position={[CENTER_X + i * 4.1, cell.height - 0.004, (cell.minZ + cell.maxZ) / 2 + j * 4.2]} size={[3.3, 3.5]} palette={palette} />
          )),
        )}
      </StaticMerge>

      <group position={[CENTER_X, 0, WALL]}>
        <Text position={[0, 6.05, 0]} fontSize={0.1} letterSpacing={0.16} color={INK.darkMuted} anchorX="center" anchorY="middle">
          {`03 / CHAPTER ${CHAPTERS.success.numeral}`}
        </Text>
        <Text position={[0, 4.95, 0]} fontSize={1.5} letterSpacing={-0.04} color={INK.dark} anchorX="center" anchorY="middle">
          {CHAPTERS.success.name}
        </Text>
        <Text position={[0, 3.82, 0]} fontSize={0.13} maxWidth={5} textAlign="center" color={INK.darkMuted} anchorX="center" anchorY="middle">
          {CHAPTERS.success.line}
        </Text>
      </group>
    </>
  )
}
