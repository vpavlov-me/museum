/** A dark museum plinth standing on the floor, centred at the group origin. */
export function Plinth({ width, height, depth, color = '#141414' }: { width: number; height: number; depth: number; color?: string }) {
  return (
    <mesh position={[0, height / 2, 0]}>
      <boxGeometry args={[width, height, depth]} />
      <meshStandardMaterial color={color} roughness={0.8} />
    </mesh>
  )
}
