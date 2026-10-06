import { useEffect, useState } from 'react'
import { useMuseumStore } from '../museum/store'

// The card waits for the visitor to linger, so walking past an object never flashes UI.
const DWELL_MS = 900

/**
 * The floating label, reserved for objects that cannot explain themselves in space.
 * Everything in focus is still announced to screen readers, labelled or not.
 */
export function ExhibitCard({ visible }: { visible: boolean }) {
  const focus = useMuseumStore((state) => state.focus)
  const card = focus?.card ?? null
  const prompt = focus?.prompt ?? null
  const overlay = card && !focus?.labelled ? card : null
  const [dwelt, setDwelt] = useState<typeof card>(null)

  useEffect(() => {
    if (!overlay) return
    const timer = window.setTimeout(() => setDwelt(overlay), DWELL_MS)
    return () => {
      window.clearTimeout(timer)
      setDwelt(null)
    }
  }, [overlay])

  const shown = visible && overlay !== null && dwelt === overlay

  return (
    <>
      <aside className={`exhibit-card ${shown ? 'exhibit-card--visible' : ''}`} aria-hidden>
        {overlay && (
          <>
            <div className="meta">
              {overlay.year} / {overlay.category}
            </div>
            <h2>{overlay.title}</h2>
            <p>{overlay.description}</p>
            <div className="exhibit-card__index meta">OBJECT {overlay.index}</div>
          </>
        )}
      </aside>
      <div className="sr-only" aria-live="polite">
        {visible && card ? `${card.title}. ${card.year}, ${card.category.toLowerCase()}. ${card.description}${prompt ? ` Action: ${prompt.toLowerCase()}.` : ''}` : ''}
      </div>
    </>
  )
}
