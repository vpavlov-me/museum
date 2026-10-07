import { INK, TYPE } from '../identity'
import { Text } from './Text'
import { facingRotation, type Facing } from './WallText'

/**
 * Where a doorway leads, set over it on the wall the visitor walks towards: a kicker
 * (NEXT · ROOM 02) and the name of the room, centred above the opening. `position` is
 * the top of the opening on the wall face, room-local.
 */
export function DoorSign({ position, facing, kicker, title }: { position: [number, number, number]; facing: Facing; kicker: string; title: string }) {
  return (
    <group position={position} rotation={facingRotation(facing)}>
      <Text position={[0, 0.62, 0]} fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="center" anchorY="middle">
        {kicker}
      </Text>
      <Text face="display" position={[0, 0.36, 0]} fontSize={0.26} color={INK.text} anchorX="center" anchorY="middle">
        {title}
      </Text>
    </group>
  )
}
