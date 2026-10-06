import { RoomShell } from '../../components/RoomShell'
import { DOORS, localDoor } from '../../museum/roomRegistry'
import { RoomContents, useRoom } from '../../museum/RoomContext'
import { PALETTES } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { CELLS } from './content'
import { Accession } from './sections/Accession'
import { Reconstruction } from './sections/Reconstruction'
import { Store } from './sections/Store'
import { Trench } from './sections/Trench'

const { accession, trench, store, reconstruction } = CELLS

/**
 * Interface Archaeology, the museum's second exhibition, in its own wing off the lobby.
 * The permanent exhibition shows the interface as an object, as architecture and as
 * the state of the world. Here it is taken out of its own time: our interfaces as a
 * future archive finds and catalogues them. The archive writes the labels; the visitor
 * knows what the things were. The last room's far door leads back to the lobby.
 */
export function ArchaeologyRoom() {
  const { origin } = useRoom()
  const door = (key: keyof typeof DOORS) => localDoor(DOORS[key], origin)

  return (
    <>
      <StaticMerge>
        <RoomShell {...accession} palette={PALETTES.archive} south={{ door: door('archaeologyEntry'), split: true }} north={null} />
        {/* The trench is the tallest: it builds both its end walls. It lays its own floor, around the pit. */}
        <RoomShell {...trench} palette={PALETTES.archive} floor={false} south={{ door: door('trenchEntry') }} north={{ door: door('storeEntry') }} />
        <RoomShell {...store} palette={PALETTES.archive} south={null} north={{ door: door('reconstructionEntry'), split: true }} />
        <RoomShell {...reconstruction} palette={PALETTES.diorama} south={{ door: door('reconstructionEntry'), split: true }} north={{}} />
      </StaticMerge>

      {/* One section per cell (accession 0 … reconstruction 3): each is drawn only while it can be seen. */}
      <RoomContents cells={[0]}>
        <Accession />
      </RoomContents>
      <RoomContents cells={[1]}>
        <Trench />
      </RoomContents>
      <RoomContents cells={[2]}>
        <Store />
      </RoomContents>
      <RoomContents cells={[3]}>
        <Reconstruction />
      </RoomContents>
    </>
  )
}
