import type { ExhibitionRooms } from '../../museum/exhibitions'
import { ArchaeologyRoom } from './Room'
import { ArchaeologyTransition } from './Transition'

/** Interface Archaeology's rooms: one chunk, loaded when the visitor heads for it. */
const rooms: ExhibitionRooms = {
  'archaeology-passage': ArchaeologyTransition,
  archaeology: ArchaeologyRoom,
}

export default rooms
