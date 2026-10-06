import { Text } from '../../../components/Text'
import { WallText } from '../../../components/WallText'
import { LightPool, Luminaire } from '../../../scene/Light'
import { PALETTES } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { CELLS, INK, THESIS, THESIS_LAYOUT, TITLE } from '../content'

const cell = CELLS.prologue
const WALL = cell.minZ + 0.02
const LEFT = 2.4
const WARM = '#efe6d6'

/**
 * After the dark passage, the ceiling rises and the light warms: a new chapter.
 * Title and thesis face the visitor as they come in; the way on is in the far corner.
 */
export function Prologue() {
  return (
    <>
      <StaticMerge>
        <Luminaire position={[LEFT + 3, cell.height - 0.004, cell.minZ + 1.4]} size={[6.4, 0.12]} palette={PALETTES.states} />
      </StaticMerge>
      {/* A wash on the title wall, as in Room 01: light you see the effect of, not the lamp. */}
      <LightPool position={[LEFT + 3, 2.6, WALL - 0.008]} rotation={[0, 0, 0]} size={[8.5, 4.6]} color={WARM} strength={0.08} />
      <LightPool position={[LEFT + 3, 0.004, cell.minZ + 1.6]} size={[7.5, 2.8]} color={WARM} strength={0.07} />

      <group position={[LEFT, 0, WALL]}>
        <Text position={[0, 4.12, 0]} fontSize={0.1} letterSpacing={0.14} color={INK.muted} anchorX="left" anchorY="top">
          {TITLE.kicker}
        </Text>
        <Text position={[0, 3.93, 0]} fontSize={0.42} letterSpacing={-0.03} color={INK.text} anchorX="left" anchorY="top">
          {TITLE.title}
        </Text>
        <Text position={[0, 3.38, 0]} fontSize={0.1} letterSpacing={0.12} color={INK.muted} anchorX="left" anchorY="top">
          {TITLE.subtitle}
        </Text>
      </group>
      <WallText position={[LEFT, WALL]} facing="south" layout={THESIS_LAYOUT} {...THESIS} />
    </>
  )
}
