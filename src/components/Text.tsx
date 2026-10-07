import type { ComponentProps } from 'react'
import { Text as TroikaText } from '@react-three/drei'
import { FONT, type Face } from '../identity'

const FACES: Record<Face, string> = { text: FONT.regular, display: FONT.display, displayItalic: FONT.displayItalic }

/**
 * Text on a museum surface, always in one of the museum's faces (drei's Text with the
 * font set): Inter by default, Instrument Serif for display titles (`face="display"`).
 */
export function Text({ face = 'text', ...props }: ComponentProps<typeof TroikaText> & { face?: Face }) {
  return <TroikaText font={FACES[face]} {...props} />
}
