import { TurnPassage } from '../../components/TurnPassage'
import { ARCHAEOLOGY_PASSAGE } from '../../museum/roomRegistry'

/** From the bright lobby into the dark, before the archive. Authored in Interface Archaeology's coordinates. */
export function ArchaeologyTransition() {
  return <TurnPassage plan={ARCHAEOLOGY_PASSAGE} entry="archaeologyEntry" number="02" title={'INTERFACE\nARCHAEOLOGY'} />
}
