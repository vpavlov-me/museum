import { Text } from '../../../components/Text'
import { WallMount } from '../../../components/WallMount'
import { WallText } from '../../../components/WallText'
import { useFocusTarget } from '../../../scene/Interaction'
import { LightPool, Luminaire } from '../../../scene/Light'
import { basicMaterial, PALETTES } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { ARCHIVE, CARDS, CELLS, INK, INSTITUTE, THESIS, THESIS_LAYOUT, TITLE } from '../content'

const cell = CELLS.accession
const WALL = cell.minZ + 0.02
const LEFT = 2.4
const WARM = '#efe6d6'
/** The archive's sign hangs on the west wall, facing the visitor's left as they come in. */
const SIGN = { x: cell.minX + 0.002, z: (cell.minZ + cell.maxZ) / 2, width: 4.4, height: 2.3, y: 2.05 }

/**
 * I — ACCESSION. The lobby of a future institution: the museum's title and thesis on
 * the wall ahead, in the museum's voice, and on the wall to the left the archive's own
 * sign, in the archive's. From here on, every label is the archive's.
 */
export function Accession() {
  useFocusTarget({ id: 'institute', position: [SIGN.x, SIGN.y, SIGN.z], distance: 6, facing: 0.6, card: CARDS.institute, labelled: true })

  return (
    <>
      <StaticMerge>
        <Luminaire position={[LEFT + 3, cell.height - 0.004, cell.minZ + 1.4]} size={[6.4, 0.12]} palette={PALETTES.archive} />
      </StaticMerge>
      <LightPool position={[LEFT + 3, 2.4, WALL - 0.008]} rotation={[0, 0, 0]} size={[8.5, 4.4]} color={WARM} strength={0.08} />
      <LightPool position={[LEFT + 3, 0.004, cell.minZ + 1.6]} size={[7.5, 2.8]} color={WARM} strength={0.07} />

      <group position={[LEFT, 0, WALL]}>
        <Text position={[0, 3.95, 0]} fontSize={0.1} letterSpacing={0.14} color={INK.muted} anchorX="left" anchorY="top">
          {TITLE.kicker}
        </Text>
        <Text position={[0, 3.76, 0]} fontSize={0.42} letterSpacing={-0.03} color={INK.text} anchorX="left" anchorY="top">
          {TITLE.title}
        </Text>
        <Text position={[0, 3.21, 0]} fontSize={0.1} letterSpacing={0.12} color={INK.muted} anchorX="left" anchorY="top">
          {TITLE.subtitle}
        </Text>
      </group>
      <WallText position={[LEFT, WALL]} facing="south" layout={THESIS_LAYOUT} {...THESIS} />

      {/* The archive's sign, in a wall mount: its stock and its ink, at the scale of an institution. */}
      <group position={[SIGN.x, SIGN.y, SIGN.z]} rotation={[0, Math.PI / 2, 0]}>
        <WallMount width={SIGN.width} height={SIGN.height}>
          <mesh material={basicMaterial(ARCHIVE.card)}>
            <planeGeometry args={[SIGN.width, SIGN.height]} />
          </mesh>
          <group position={[-SIGN.width / 2 + 0.3, SIGN.height / 2 - 0.3, 0.003]}>
            <Text fontSize={0.075} letterSpacing={0.18} color={ARCHIVE.inkMuted} anchorX="left" anchorY="top">
              {INSTITUTE.name}
            </Text>
            <Text position={[0, -0.2, 0]} fontSize={0.3} letterSpacing={-0.02} lineHeight={1.05} maxWidth={3.6} color={ARCHIVE.ink} anchorX="left" anchorY="top">
              {INSTITUTE.gallery}
            </Text>
            <Text position={[0, -0.92, 0]} fontSize={0.1} letterSpacing={0.06} color={ARCHIVE.ink} anchorX="left" anchorY="top">
              {INSTITUTE.dates}
            </Text>
            <Text position={[0, -1.18, 0]} fontSize={0.075} lineHeight={1.5} maxWidth={3.6} color={ARCHIVE.inkMuted} anchorX="left" anchorY="top">
              {INSTITUTE.line}
            </Text>
          </group>
        </WallMount>
      </group>
    </>
  )
}
