import { Text } from '../../components/Text'
import { INK, TYPE } from '../../identity'
import { EXHIBITIONS, exhibitionOf } from '../../museum/exhibitions'
import { SPACES, SPAWN } from '../../museum/roomRegistry'
import { CIRCLE } from '../../scene/geometry'
import { basicMaterial } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'

/*
 * The plan on the lobby wall: every space in outline, each exhibition in its own tone
 * (the same tones as the plan overlay), north up, and YOU ARE HERE where the visitor
 * came in. A plaque, not a screen: it is drawn once and never changes.
 */

const bounds = SPACES.flatMap((space) => space.bounds)
const MIN_X = Math.min(...bounds.map((r) => r.minX))
const MAX_X = Math.max(...bounds.map((r) => r.maxX))
const MIN_Z = Math.min(...bounds.map((r) => r.minZ))
const MAX_Z = Math.max(...bounds.map((r) => r.maxZ))
const DRAWING = { height: 2.2 }
const SCALE = DRAWING.height / (MAX_Z - MIN_Z)
const WIDTH = (MAX_X - MIN_X) * SCALE
const LINE = 0.006
const PANEL = { width: WIDTH + 1.7, height: DRAWING.height + 0.3 }

const TONE: Record<string, string> = { lobby: '#efede6', permanent: '#8f8c85', archaeology: '#b09676', 'dark-patterns': '#c8473b' }

/** Plaque coordinates from world: x to the right is east, y up is north. */
const at = (x: number, z: number): [number, number] => [(x - MIN_X) * SCALE - WIDTH / 2, DRAWING.height / 2 - (z - MIN_Z) * SCALE]

function Outlines() {
  return (
    <>
      {SPACES.flatMap((space) =>
        space.bounds.map((r, i) => {
          const material = basicMaterial(TONE[exhibitionOf(space.id) ?? 'lobby'])
          const [x0, y0] = at(r.minX, r.maxZ)
          const [x1, y1] = at(r.maxX, r.minZ)
          const w = x1 - x0
          const h = y1 - y0
          return (
            <group key={`${space.id}:${i}`}>
              <mesh position={[x0 + w / 2, y0, 0]} material={material}>
                <planeGeometry args={[w + LINE, LINE]} />
              </mesh>
              <mesh position={[x0 + w / 2, y1, 0]} material={material}>
                <planeGeometry args={[w + LINE, LINE]} />
              </mesh>
              <mesh position={[x0, y0 + h / 2, 0]} material={material}>
                <planeGeometry args={[LINE, Math.abs(h)]} />
              </mesh>
              <mesh position={[x1, y0 + h / 2, 0]} material={material}>
                <planeGeometry args={[LINE, Math.abs(h)]} />
              </mesh>
            </group>
          )
        }),
      )}
    </>
  )
}

/** On a wall facing east (the lobby's west wall). `position` is the plaque's centre, room-local. */
export function LobbyPlan({ position }: { position: [number, number, number] }) {
  const [hx, hy] = at(SPAWN.position[0], SPAWN.position[2])
  const left = -PANEL.width / 2 + 0.12
  const legend = left + WIDTH + 0.22

  return (
    <group position={position} rotation={[0, Math.PI / 2, 0]}>
      <StaticMerge>
        <mesh material={basicMaterial('#1f1e1c')}>
          <planeGeometry args={[PANEL.width, PANEL.height]} />
        </mesh>
        <group position={[left + WIDTH / 2, 0, 0.002]}>
          <Outlines />
          <mesh position={[hx, hy, 0.001]} scale={0.035} geometry={CIRCLE} material={basicMaterial('#efede6')} />
        </group>
      </StaticMerge>
      <Text position={[left + WIDTH / 2 + hx + 0.06, hy, 0.004]} fontSize={0.03} letterSpacing={0.12} color={INK.text} anchorX="left" anchorY="middle">
        YOU ARE HERE
      </Text>

      <group position={[legend, PANEL.height / 2 - 0.16, 0.003]}>
        <Text fontSize={TYPE.labelMeta} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
          PLAN OF THE MUSEUM · NORTH IS UP
        </Text>
        {/* The key: a swatch per line, and the lines as one text. */}
        <StaticMerge>
          {[...EXHIBITIONS.map((exhibition) => exhibition.id), 'lobby'].map((id, i) => (
            <mesh key={id} position={[0.025, -0.195 - i * 0.2, 0]} material={basicMaterial(TONE[id])}>
              <planeGeometry args={[0.05, 0.05]} />
            </mesh>
          ))}
        </StaticMerge>
        <Text position={[0.1, -0.16, 0]} fontSize={0.06} lineHeight={3.33} color={INK.text} anchorX="left" anchorY="top">
          {[...EXHIBITIONS.map((e) => `${e.number}  ${e.title}${e.kind === 'temporary' ? ' (temporary)' : ''}`), 'Lobby'].join('\n')}
        </Text>
        <Text position={[0, -0.36 - (EXHIBITIONS.length + 1) * 0.2, 0]} fontSize={0.045} lineHeight={1.5} maxWidth={1.3} color={INK.body} anchorX="left" anchorY="top">
          The permanent exhibition is three rooms, one after another. Each exhibition ends at a door back to this lobby. Press P for this plan at any time.
        </Text>
      </group>
    </group>
  )
}
