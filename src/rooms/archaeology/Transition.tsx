import { TurnPassage } from '../../components/TurnPassage'
import { TRANSITION_04 } from '../../museum/roomRegistry'

/** The passage after SUCCESS: from the brightest room back into the dark, before the archive. Authored in Room 04's coordinates. */
export function ArchaeologyTransition() {
  return <TurnPassage plan={TRANSITION_04} entry="archaeologyEntry" number="04" title={'INTERFACE\nARCHAEOLOGY'} />
}
