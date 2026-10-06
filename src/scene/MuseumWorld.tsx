import { Fragment, type ComponentType } from 'react'
import { AudioDirector } from '../audio/AudioDirector'
import type { Presence } from '../audio/engine'
import { SPACES } from '../museum/roomRegistry'
import { RoomGroup } from '../museum/RoomContext'
import { AcceptedRoom } from '../rooms/accepted/Room'
import { Colophon } from '../rooms/colophon/Colophon'
import { Entrance } from '../rooms/entrance/Entrance'
import { Passage } from '../rooms/passage/Passage'
import { StatesRoom } from '../rooms/states/Room'
import { StatesTransition } from '../rooms/states/Transition'
import { TheButtonRoom } from '../rooms/the-button/Room'
import { Controls } from './Controls'
import { DebugBridge } from './DebugBridge'
import { FocusSystem } from './Interaction'
import { LightRig } from './Light'
import { Lighting } from './Lighting'
import { PerfReadout } from './PerfReadout'
import { Player } from './Player'

const ROOMS: Record<string, ComponentType> = {
  entrance: Entrance,
  'the-button': TheButtonRoom,
  passage: Passage,
  accepted: AcceptedRoom,
  'transition-03': StatesTransition,
  states: StatesRoom,
  colophon: Colophon,
}

/**
 * The whole museum. `visit` counts visits: starting another remounts the rooms and the
 * visitor (every room back to its first state, the visitor back at the door), while the
 * controls, lights and focus system carry on.
 */
export function MuseumWorld({
  visit,
  active,
  presence,
  onLockChange,
}: {
  visit: number
  active: boolean
  presence: Presence
  onLockChange: (locked: boolean) => void
}) {
  return (
    <>
      <Lighting />
      <LightRig />

      <Fragment key={visit}>
        {SPACES.map((space) => {
          const Room = ROOMS[space.id]
          return (
            <RoomGroup key={space.id} space={space}>
              <Room />
            </RoomGroup>
          )
        })}
        <Player active={active} />
      </Fragment>
      <FocusSystem active={active} />
      <AudioDirector presence={presence} />
      <Controls onLockChange={onLockChange} />
      {import.meta.env.DEV && <DebugBridge setLocked={onLockChange} />}
      {import.meta.env.DEV && <PerfReadout />}
    </>
  )
}
