import type { ExhibitionRooms } from '../museum/exhibitions'
import { AcceptedRoom } from './accepted/Room'
import { Colophon } from './colophon/Colophon'
import { Entrance } from './entrance/Entrance'
import { Passage } from './passage/Passage'
import { StatesRoom } from './states/Room'
import { StatesTransition } from './states/Transition'
import { TheButtonRoom } from './the-button/Room'

/** The permanent exhibition's rooms: one chunk, loaded when the visitor heads for it. */
const rooms: ExhibitionRooms = {
  entrance: Entrance,
  'the-button': TheButtonRoom,
  passage: Passage,
  accepted: AcceptedRoom,
  'transition-03': StatesTransition,
  states: StatesRoom,
  colophon: Colophon,
}

export default rooms
