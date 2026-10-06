import type { ComponentProps } from 'react'
import { Text as TroikaText } from '@react-three/drei'
import { FONT } from '../identity'

/** Text on a museum surface, always in the museum's typeface (drei's Text with the font set). */
export function Text(props: ComponentProps<typeof TroikaText>) {
  return <TroikaText font={FONT.regular} {...props} />
}
