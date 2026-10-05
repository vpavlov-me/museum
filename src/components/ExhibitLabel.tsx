import { Text } from '@react-three/drei'

/** Small gallery caption, e.g. "01 / 1995", set in the museum's metadata style. */
export function ExhibitLabel({ position, children }: { position: [number, number, number]; children: string }) {
  return (
    <Text position={position} fontSize={0.075} letterSpacing={0.14} color="#8f8c85" anchorX="left" anchorY="top">
      {children}
    </Text>
  )
}
