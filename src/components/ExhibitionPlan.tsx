import { useMemo } from 'react'
import { displayCase, INK, TYPE } from '../identity'
import { getExhibition, type ExhibitionId } from '../museum/exhibitions'
import { SPACES } from '../museum/roomRegistry'
import type { Rect } from '../museum/types'
import { CIRCLE } from '../scene/geometry'
import { basicMaterial } from '../scene/materials'
import { StaticMerge } from '../scene/StaticMerge'
import { Text } from './Text'
import { facingRotation, type Facing } from './WallText'

const DRAWING = { width: 1.5, height: 2 }
const LINE = 0.006
const PANEL = { pad: 0.14, legend: 1.25 }
/** The plaque: the same dark stock as the lobby's plan. */
const STOCK = basicMaterial('#1f1e1c')

const centre = (rects: Rect[]): [number, number] => {
  const minX = Math.min(...rects.map((r) => r.minX))
  const maxX = Math.max(...rects.map((r) => r.maxX))
  const minZ = Math.min(...rects.map((r) => r.minZ))
  const maxZ = Math.max(...rects.map((r) => r.maxZ))
  return [(minX + maxX) / 2, (minZ + maxZ) / 2]
}

/**
 * The plan at an exhibition's entrance: its spaces in outline, north up, each room (or
 * chapter) numbered where it lies, YOU ARE HERE, and the rooms in order beside it. A
 * plaque, drawn once. `position` is its centre on the wall, room-local; `here` is the
 * visitor's spot in front of it, in world coordinates.
 */
export function ExhibitionPlan({ exhibition, position, facing, here }: { exhibition: ExhibitionId; position: [number, number, number]; facing: Facing; here: [number, number] }) {
  const plan = useMemo(() => {
    const definition = getExhibition(exhibition)!
    const spaces = SPACES.filter((space) => definition.spaces.includes(space.id))
    const rects = spaces.flatMap((space) => space.bounds)
    const minX = Math.min(...rects.map((r) => r.minX))
    const maxX = Math.max(...rects.map((r) => r.maxX))
    const minZ = Math.min(...rects.map((r) => r.minZ))
    const maxZ = Math.max(...rects.map((r) => r.maxZ))
    const scale = Math.min(DRAWING.width / (maxX - minX), DRAWING.height / (maxZ - minZ))
    const width = (maxX - minX) * scale
    const height = (maxZ - minZ) * scale
    /** Plaque coordinates from world: east to the right, north up, centred on the drawing. */
    const at = (x: number, z: number): [number, number] => [(x - minX) * scale - width / 2, height / 2 - (z - minZ) * scale]
    // Rooms by number where the exhibition has them (the permanent one); otherwise its chapters.
    const numbered = spaces.filter((space) => space.number)
    const marks = numbered.length
      ? numbered.map((space) => ({ label: space.number!, name: space.title, at: at(...centre(space.bounds)) }))
      : spaces.flatMap((space) =>
          (space.zones ?? []).map((zone) => {
            const [numeral, name] = zone.label.split(' / ')
            return { label: numeral, name: displayCase(name), at: at(...centre(zone.bounds)) }
          }),
        )
    return { title: definition.title, rects, at, width, height, marks }
  }, [exhibition])

  const [hx, hy] = plan.at(here[0], here[1])
  const panelWidth = plan.width + PANEL.legend + PANEL.pad * 3
  const panelHeight = Math.max(plan.height, 1.2) + PANEL.pad * 2
  const drawingX = -panelWidth / 2 + PANEL.pad + plan.width / 2
  const legendX = drawingX + plan.width / 2 + PANEL.pad
  const outline = basicMaterial(INK.muted)

  return (
    <group position={position} rotation={facingRotation(facing)}>
      <StaticMerge>
        <mesh material={STOCK}>
          <planeGeometry args={[panelWidth, panelHeight]} />
        </mesh>
        <group position={[drawingX, 0, 0.002]}>
          {plan.rects.map((r, i) => {
            const [x0, y0] = plan.at(r.minX, r.maxZ)
            const [x1, y1] = plan.at(r.maxX, r.minZ)
            const w = x1 - x0
            const h = y1 - y0
            return (
              <group key={i}>
                <mesh position={[x0 + w / 2, y0, 0]} material={outline}>
                  <planeGeometry args={[w + LINE, LINE]} />
                </mesh>
                <mesh position={[x0 + w / 2, y1, 0]} material={outline}>
                  <planeGeometry args={[w + LINE, LINE]} />
                </mesh>
                <mesh position={[x0, y0 + h / 2, 0]} material={outline}>
                  <planeGeometry args={[LINE, Math.abs(h)]} />
                </mesh>
                <mesh position={[x1, y0 + h / 2, 0]} material={outline}>
                  <planeGeometry args={[LINE, Math.abs(h)]} />
                </mesh>
              </group>
            )
          })}
          <mesh position={[hx, hy, 0.001]} scale={0.03} geometry={CIRCLE} material={basicMaterial(INK.text)} />
        </group>
      </StaticMerge>

      <group position={[drawingX, 0, 0.004]}>
        {plan.marks.map((mark, i) => (
          <Text key={i} face="display" position={[mark.at[0], mark.at[1], 0]} fontSize={0.09} color={INK.text} anchorX="center" anchorY="middle">
            {mark.label}
          </Text>
        ))}
        <Text position={[hx, hy - 0.045, 0]} fontSize={0.028} letterSpacing={TYPE.tracking} color={INK.text} anchorX="center" anchorY="top">
          YOU ARE HERE
        </Text>
      </group>

      <group position={[legendX, panelHeight / 2 - PANEL.pad, 0.004]}>
        <Text fontSize={TYPE.labelMeta} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
          PLAN · NORTH IS UP
        </Text>
        <Text face="display" position={[0, -0.09, 0]} fontSize={0.13} maxWidth={PANEL.legend} color={INK.text} anchorX="left" anchorY="top">
          {plan.title}
        </Text>
        <Text position={[0, -0.32, 0]} fontSize={0.05} lineHeight={1.9} maxWidth={PANEL.legend} color={INK.body} anchorX="left" anchorY="top">
          {plan.marks.map((mark) => `${mark.label}   ${mark.name}`).join('\n')}
        </Text>
      </group>
    </group>
  )
}
