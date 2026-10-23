import { INK_ON_LIGHT, type Ink } from '../identity'
import { Text } from './Text'
import { facingRotation, WallText, type Facing, type WallTextLayout } from './WallText'

/**
 * A chapter of an exhibition's essay (v3, #48). The wall carries its title, its first
 * paragraph and its quote, set large; the text version carries all of it.
 */
export type EssayChapter = {
  id: string
  kicker: string
  title: string
  paragraphs: string[]
  quote: string
  /** Where the block begins on its wall: [x, z], room-local; reading runs to the visitor's right. */
  position: [number, number]
  facing: Facing
}

const LAYOUT: WallTextLayout = { top: 2.55, titleWidth: 2, gap: 0.4, bodyWidth: 3.6, bodySize: 0.125 }
const QUOTE = { top: 3.72, size: 0.28, width: 6 }

/**
 * A chapter on a 4 m free-standing wall: the quote large across the top, then the title
 * and the first paragraph at eye level. A prologue leaves its quote off (`quote={false}`):
 * the exhibition's title takes the top of its wall.
 */
export function ChapterWall({ chapter, quote = true, ink = INK_ON_LIGHT }: { chapter: EssayChapter; quote?: boolean; ink?: Ink }) {
  return (
    <>
      {quote && (
        <group position={[chapter.position[0], 0, chapter.position[1]]} rotation={facingRotation(chapter.facing)}>
          <Text face="displayItalic" position={[0, QUOTE.top, 0]} fontSize={QUOTE.size} lineHeight={1.1} maxWidth={QUOTE.width} color={ink.text} anchorX="left" anchorY="top">
            {`“${chapter.quote}”`}
          </Text>
        </group>
      )}
      <WallText position={chapter.position} facing={chapter.facing} layout={LAYOUT} ink={ink} kicker={chapter.kicker} title={chapter.title} body={chapter.paragraphs[0]} />
    </>
  )
}
