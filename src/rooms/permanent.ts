import type { ExhibitionRooms } from '../museum/exhibitions'
import { Entrance } from './entrance/Entrance'
import { TheButtonRoom } from './the-button/Room'

/**
 * The permanent exhibition's rooms: one chunk, loaded when the visitor heads for it.
 * For now the entrance and Room 01 (#48); Rooms 02 and 03, the passages and the
 * colophon are closed, their code kept in rooms/ for when they open again.
 */
const rooms: ExhibitionRooms = {
  entrance: Entrance,
  'the-button': TheButtonRoom,
}

export default rooms
