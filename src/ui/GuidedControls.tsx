import { useEffect } from 'react'
import { getSpace } from '../museum/roomRegistry'
import { museumStore, useMuseumStore } from '../museum/store'
import { TOUR } from '../museum/tour'
import { tour, useTour } from '../museum/tourState'
import { interactWithFocus } from '../scene/Interaction'
import { SoundToggle } from './SoundToggle'

const sentence = (prompt: string) => prompt.charAt(0) + prompt.slice(1).toLowerCase()

/**
 * The guided tour's controls: back and next along the route, the action the visitor
 * is facing (what E does when walking), and a way out. Large enough for a thumb,
 * reachable by keyboard; the arrow keys move along the route too.
 */
export function GuidedControls({ visible }: { visible: boolean }) {
  const index = useTour((state) => state.index)
  const moving = useTour((state) => state.moving)
  const blocked = useTour((state) => state.blocked)
  const prompt = useMuseumStore((state) => state.focus?.prompt ?? null)
  const spaceId = useMuseumStore((state) => state.spaceId)
  const stop = TOUR[index]
  const last = index === TOUR.length - 1

  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'ArrowRight') tour.next()
      if (event.code === 'ArrowLeft') tour.previous()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  return (
    <section className={`guided ${visible ? 'guided--visible' : ''}`} aria-hidden={!visible} aria-label="Guided tour">
      <div className="guided__top">
        <SoundToggle />
        <button className="museum-button museum-button--quiet guided__leave" type="button" onClick={() => museumStore.set({ ended: true })}>
          Leave
        </button>
      </div>

      <div className="guided__middle">
        {prompt && !moving && (
          <button className="museum-button" type="button" onClick={() => interactWithFocus()}>
            {sentence(prompt)}
          </button>
        )}
        <p className="guided__hint meta" role="status">
          {blocked ? (prompt ? `The way on is closed. ${sentence(prompt)} to continue.` : 'The way on is closed for now. Give it a moment.') : ''}
        </p>
      </div>

      <nav className="guided__bar" aria-label="Tour">
        <button className="museum-button museum-button--quiet" type="button" onClick={() => tour.previous()} disabled={index === 0 || moving}>
          <span aria-hidden>←</span> Back
        </button>
        <div className="guided__stop" aria-live="polite">
          <span className="meta">
            <span className="sr-only">{getSpace(spaceId)?.title}, stop </span>
            {index + 1} / {TOUR.length}
          </span>
          <span className="guided__title">{stop.title}</span>
        </div>
        <button className="museum-button" type="button" onClick={() => tour.next()} disabled={last || moving}>
          Next <span aria-hidden>→</span>
        </button>
      </nav>
      <p className="guided__drag meta" aria-hidden>
        Drag to look around
      </p>
    </section>
  )
}
