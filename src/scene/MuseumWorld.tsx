import type { ComponentType } from 'react'
import { SPACES } from '../museum/roomRegistry'
import { RoomGroup } from '../museum/RoomContext'
import { AcceptedRoom } from '../rooms/accepted/Room'
import { Entrance } from '../rooms/entrance/Entrance'
import { Passage } from '../rooms/passage/Passage'
import { TheButtonRoom } from '../rooms/the-button/Room'
import { Controls } from './Controls'
import { DebugBridge } from './DebugBridge'
import { FocusSystem } from './Interaction'
import { Lighting } from './Lighting'
import { Player } from './Player'

const ROOMS: Record<string, ComponentType> = {
  entrance: Entrance,
  'the-button': TheButtonRoom,
  passage: Passage,
  accepted: AcceptedRoom,
}

export function MuseumWorld({ active, onLockChange }: { active: boolean; onLockChange: (locked: boolean) => void }) {
  return (
    <>
      <Lighting />

      {SPACES.map((space) => {
        const Room = ROOMS[space.id]
        return (
          <RoomGroup key={space.id} space={space}>
            <Room />
          </RoomGroup>
        )
      })}

      <Player active={active} />
      <FocusSystem active={active} />
      <Controls onLockChange={onLockChange} />
      {import.meta.env.DEV && <DebugBridge setLocked={onLockChange} />}
    </>
  )
}
