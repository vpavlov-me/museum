import { Text } from '../../../components/Text'
import { facingRotation, type Facing } from '../../../components/WallText'
import { INK, TYPE } from '../../../identity'

/** A part of the room, named on its wall in the museum's signage: kicker over name. `position` is the top-left corner. */
export function CellSign({ position, name, kicker, facing = 'south' }: { position: [number, number, number]; name: string; kicker: string; facing?: Facing }) {
  return (
    <group position={position} rotation={facingRotation(facing)}>
      <Text fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
        {kicker}
      </Text>
      <Text position={[0, -0.16, 0]} fontSize={0.3} letterSpacing={-0.02} color={INK.text} anchorX="left" anchorY="top">
        {name}
      </Text>
    </group>
  )
}
