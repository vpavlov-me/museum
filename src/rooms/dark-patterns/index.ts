import type { ExhibitionRooms } from '../../museum/exhibitions'
import { DarkPassage, DarkPatternsRoom } from './Room'

/** Dark Patterns' rooms: one chunk, loaded when the visitor heads for it. */
const rooms: ExhibitionRooms = {
  'dark-passage': DarkPassage,
  'dark-patterns': DarkPatternsRoom,
}

export default rooms
