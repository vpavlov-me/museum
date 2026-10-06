import { RoomShell } from '../../components/RoomShell'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { CELLS } from './content'
import { EmptyState } from './sections/Empty'
import { ErrorState } from './sections/Error'
import { LoadingState } from './sections/Loading'
import { OFFLINE_PALETTE, OfflineState } from './sections/Offline'
import { Prologue } from './sections/Prologue'
import { SuccessState } from './sections/Success'

const { prologue, loading, empty, error, offline, success } = CELLS

/**
 * Room 03 — Interface States.
 * Room 01 showed the interface as an object, Room 02 its behaviour as architecture.
 * Here the interface's state becomes the state of the room itself: a room that has
 * not finished loading, a room with nothing in it, a room built wrongly, a room that
 * loses its connection and its light, and finally a room where everything is done.
 * Each cell is a different kind of space, and no state is a plinth.
 */
export function StatesRoom() {
  const { origin } = useRoom()
  const door = (key: keyof typeof DOORS) => localDoor(DOORS[key], origin)

  return (
    <>
      <StaticMerge>
        <RoomShell {...prologue} palette={PALETTES.states} south={{ door: door('statesEntry'), split: true }} north={{ door: door('loadingEntry') }} />
        <RoomShell {...loading} palette={PALETTES.states} south={null} north={null} />
        <RoomShell {...empty} palette={PALETTES.empty} south={{ door: door('loadingExit') }} north={{ door: door('errorEntry') }} />
        {/* ERROR's east wall is built by the state itself: a piece of it is missing. */}
        <RoomShell {...error} palette={PALETTES.states} south={null} north={{ door: door('errorExit'), split: true }} east={null} />
        {/* OFFLINE builds its own half of both shared walls, so its light can fail alone. */}
        <RoomShell {...offline} palette={OFFLINE_PALETTE} south={{ door: door('errorExit'), split: true }} north={{ door: door('offlineExit'), split: true }} />
        <RoomShell {...success} palette={PALETTES.success} south={{ door: door('offlineExit'), split: true }} north={{}} />
      </StaticMerge>

      <RoomContents>
        <Prologue />
        <LoadingState />
        <EmptyState />
        <ErrorState />
        <OfflineState />
        <SuccessState />
      </RoomContents>
    </>
  )
}
