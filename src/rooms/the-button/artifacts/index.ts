import type { ComponentType } from 'react'
import type { SoundName } from '../../../audio/sounds'
import type { ArtifactKind } from '../content'
import { Aqua } from './Aqua'
import { CallButton } from './CallButton'
import { Doorbell } from './Doorbell'
import { Leather } from './Leather'
import { MAC_HEIGHT, Macintosh } from './Macintosh'
import { Material } from './Material'
import { QuietButton } from './QuietButton'
import { RaisedButton } from './RaisedButton'
import { BUTTON, type ArtifactProps } from './shared'
import { Slide } from './Slide'
import { Star } from './Star'
import { Switch } from './Switch'
import { Typewriter } from './Typewriter'
import { Word } from './Word'

export type ArtifactSpec = {
  component: ComponentType<ArtifactProps>
  /**
   * Height of a screen-era piece, drawn centred on its origin and stood upright in a cradle;
   * `null` for an object that is built standing on its own base.
   */
  height: number | null
  /** Width of what stands in the cradle; `null` for an object that stands without one. */
  cradle: number | null
  /** Each object answers a press in its own material. */
  sound: SoundName
}

export const ARTIFACTS: Record<ArtifactKind, ArtifactSpec> = {
  typewriter: { component: Typewriter, height: null, cradle: null, sound: 'key-strike' },
  switch: { component: Switch, height: null, cradle: null, sound: 'switch-snap' },
  call: { component: CallButton, height: null, cradle: 0.3, sound: 'switch-snap' },
  doorbell: { component: Doorbell, height: null, cradle: 0.42, sound: 'bell' },
  star: { component: Star, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-flat' },
  macintosh: { component: Macintosh, height: MAC_HEIGHT, cradle: BUTTON.width, sound: 'button-flat' },
  raised: { component: RaisedButton, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-bevel' },
  aqua: { component: Aqua, height: 0.54, cradle: BUTTON.width, sound: 'button-gloss' },
  slide: { component: Slide, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-quiet' },
  leather: { component: Leather, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-bevel' },
  word: { component: Word, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-flat' },
  material: { component: Material, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-flat' },
  quiet: { component: QuietButton, height: BUTTON.height, cradle: BUTTON.width, sound: 'button-quiet' },
}
