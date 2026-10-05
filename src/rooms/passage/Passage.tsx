import { Text } from '@react-three/drei'
import { RoomShell } from '../../components/RoomShell'

// Narrow, low and dim: a pause between two exhibitions. Room-local.
const PASSAGE = { minX: -1.4, maxX: 1.4, minZ: -5, maxZ: 5, height: 3 }

export function Passage() {
  const { minZ, maxZ, height } = PASSAGE

  return (
    <>
      {/* Both end walls are built by the larger rooms on either side. */}
      <RoomShell {...PASSAGE} wallColor="#2f2e2c" north={null} south={null} />

      {/* A single strip of light on the ceiling pulls the eye forward. */}
      <mesh position={[0, height - 0.005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, maxZ - minZ - 1.2]} />
        <meshBasicMaterial color="#9d988d" />
      </mesh>
      <pointLight position={[0, 2.6, -1]} intensity={3} distance={7} color="#efe6d6" />

      <Text position={[0, 2.8, minZ + 0.02]} fontSize={0.085} letterSpacing={0.14} color="#bdbab2" anchorX="center" anchorY="middle">
        02 / THINGS WE SOMEHOW ACCEPTED
      </Text>
    </>
  )
}
