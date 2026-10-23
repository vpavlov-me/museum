import type { ExhibitionRooms } from '../museum/exhibitions'
import { AcceptedRoom } from './accepted/Room'
import { TheButtonRoom } from './the-button/Room'

/**
 * The permanent exhibition's rooms: one chunk, loaded when the visitor heads for it.
 * An enfilade of halls (#55): The Button, then Things We Somehow Accepted to the north.
 * The entrance, Room 03, the passages and the colophon are closed, their code kept in
 * rooms/ for when they open again.
 */
const rooms: ExhibitionRooms = {
  'the-button': TheButtonRoom,
  accepted: AcceptedRoom,
}

export default rooms
