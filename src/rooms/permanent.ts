import type { ExhibitionRooms } from '../museum/exhibitions'
import { TheButtonRoom } from './the-button/Room'

/**
 * The permanent exhibition's rooms: one chunk, loaded when the visitor heads for it.
 * For now one hall, The Button (#48); the entrance, Rooms 02 and 03, the passages and
 * the colophon are closed, their code kept in rooms/ for when they open again.
 */
const rooms: ExhibitionRooms = {
  'the-button': TheButtonRoom,
}

export default rooms
