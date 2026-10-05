import { Text } from '@react-three/drei'
import { RoomShell } from '../../components/RoomShell'
import { WallText, type WallTextLayout } from '../../components/WallText'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { useRoom } from '../../museum/RoomContext'
import { Luminaire } from '../../scene/Light'
import { basicMaterial, PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'

const palette = PALETTES.entrance

// Entrance shell, room-local. Lower than the galleries so Room 01 opens up after it.
const HALL = { minX: -4.5, maxX: 4.5, minZ: -6, maxZ: 6, height: 4.4 }

const STATEMENT_LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 3, gap: 0.45, bodyWidth: 3.6 }

const VISIT = [
  ['W A S D', 'Walk'],
  ['Mouse', 'Look'],
  ['E', 'Interact, when an object invites it'],
  ['Esc', 'Pause and release the cursor'],
]

/** A short vestibule that names the museum, sets the scale and points the visitor into Room 01. */
export function Entrance() {
  const { origin } = useRoom()
  const door = localDoor(DOORS.entrance, origin)
  const wall = HALL.minZ + 0.02

  return (
    <>
      <StaticMerge>
        {/* The north wall is Room 01's south wall, built by that room. */}
        <RoomShell {...HALL} palette={palette} north={null} south={{}} />

        {/* A soft laylight: even, slightly brighter than the galleries ahead. */}
        {[-1.6, 1.6].map((x) =>
          [-2.6, 0.4, 3.4].map((z) => <Luminaire key={`${x}:${z}`} position={[x, HALL.height - 0.004, z]} size={[2, 2.6]} palette={palette} />),
        )}

        {/* A single line on the floor leads towards the first room. */}
        <mesh position={[0, 0.003, (HALL.minZ + 3.4) / 2]} rotation={[-Math.PI / 2, 0, 0]} material={basicMaterial('#57544e')}>
          <planeGeometry args={[0.025, 3.4 - HALL.minZ]} />
        </mesh>
      </StaticMerge>

      <Text position={[0, 3.72, wall]} fontSize={0.56} letterSpacing={-0.03} color="#efede6" anchorX="center" anchorY="middle">
        INTERFACE MUSEUM
      </Text>

      {/* Directional sign beside the door. */}
      <group position={[door.center + door.width / 2 + 0.45, 0, wall]}>
        <Text position={[0, 1.95, 0]} fontSize={0.075} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
          ← ROOM 01
        </Text>
        <Text position={[0, 1.78, 0]} fontSize={0.22} letterSpacing={-0.02} color="#efede6" anchorX="left" anchorY="top">
          The Button
        </Text>
        <Text position={[0, 1.48, 0]} fontSize={0.075} letterSpacing={0.1} color="#8f8c85" anchorX="left" anchorY="top">
          A SMALL HISTORY OF DIGITAL AFFORDANCE
        </Text>
      </group>

      <WallText
        position={[HALL.minX + 0.02, 4.4]}
        facing="east"
        layout={STATEMENT_LAYOUT}
        kicker="INTERFACE MUSEUM / PROTOTYPE 03"
        title="Interfaces, given physical form."
        body="An exhibition about the controls, conventions and habits we use every day without noticing them. Each room holds one idea. Walk slowly and read the walls. Some objects respond when you approach them and press E."
      />

      {/* How to visit: a quiet gallery label, not a menu. */}
      <group position={[HALL.maxX - 0.02, 0, -1.6]} rotation={[0, -Math.PI / 2, 0]}>
        <Text position={[0, 2.5, 0]} fontSize={0.09} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
          HOW TO VISIT
        </Text>
        {VISIT.map(([key, action], i) => (
          <group key={key} position={[0, 2.18 - i * 0.3, 0]}>
            <Text fontSize={0.13} color="#efede6" anchorX="left" anchorY="top">
              {key}
            </Text>
            <Text position={[1.05, 0, 0]} fontSize={0.13} color="#bdbab2" anchorX="left" anchorY="top">
              {action}
            </Text>
          </group>
        ))}
      </group>

    </>
  )
}
