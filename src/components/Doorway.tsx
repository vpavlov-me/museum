import { WALL_THICKNESS } from '../museum/roomRegistry'

export type DoorOpening = {
  /** Centre of the opening along the wall (local x). */
  center: number
  width: number
  height: number
}

const FRAME = { width: 0.06, color: '#1d1c1b', threshold: '#191918' }

/**
 * A wall running along x at `z`, from `from` to `to`, optionally pierced by a door.
 * The opening gets a slim dark reveal on both faces and a threshold strip on the floor,
 * so passing between rooms reads as stepping through architecture.
 */
export function Doorway({
  from,
  to,
  z,
  height,
  color,
  door,
  thickness = WALL_THICKNESS,
}: {
  from: number
  to: number
  z: number
  height: number
  color: string
  door?: DoorOpening
  thickness?: number
}) {
  if (!door) {
    return (
      <mesh position={[(from + to) / 2, height / 2, z]}>
        <boxGeometry args={[to - from, height, thickness]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
    )
  }

  const left = door.center - door.width / 2
  const right = door.center + door.width / 2
  const lintel = height - door.height

  return (
    <group>
      <mesh position={[(from + left) / 2, height / 2, z]}>
        <boxGeometry args={[left - from, height, thickness]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      <mesh position={[(right + to) / 2, height / 2, z]}>
        <boxGeometry args={[to - right, height, thickness]} />
        <meshStandardMaterial color={color} roughness={0.92} />
      </mesh>
      {lintel > 0 && (
        <mesh position={[door.center, door.height + lintel / 2, z]}>
          <boxGeometry args={[door.width, lintel, thickness]} />
          <meshStandardMaterial color={color} roughness={0.92} />
        </mesh>
      )}

      {/* Reveal: jambs and head, slightly proud of both wall faces. */}
      {[left + FRAME.width / 2, right - FRAME.width / 2].map((x) => (
        <mesh key={x} position={[x, door.height / 2, z]}>
          <boxGeometry args={[FRAME.width, door.height, thickness + 0.03]} />
          <meshStandardMaterial color={FRAME.color} roughness={0.85} />
        </mesh>
      ))}
      {lintel > 0 && (
        <mesh position={[door.center, door.height - FRAME.width / 2, z]}>
          <boxGeometry args={[door.width, FRAME.width, thickness + 0.03]} />
          <meshStandardMaterial color={FRAME.color} roughness={0.85} />
        </mesh>
      )}

      <mesh position={[door.center, 0.003, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[door.width, thickness + 0.3]} />
        <meshBasicMaterial color={FRAME.threshold} />
      </mesh>
    </group>
  )
}
