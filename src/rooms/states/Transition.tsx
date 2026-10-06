import { TurnPassage } from '../../components/TurnPassage'
import { TRANSITION_03 } from '../../museum/roomRegistry'

/** The passage after the feed: a reset after the density of Room 02. Authored in Room 03's coordinates. */
export function StatesTransition() {
  return <TurnPassage plan={TRANSITION_03} entry="statesEntry" number="03" title={'INTERFACE\nSTATES'} />
}
