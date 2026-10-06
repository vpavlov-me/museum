import { useEffect } from 'react'
import { useExhibitionStatuses } from '../museum/exhibitionLoader'
import { EXHIBITIONS, getExhibition } from '../museum/exhibitions'
import { navigation } from '../museum/navigation'
import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'
import { TOURS } from '../museum/tour'
import { tour, useTour } from '../museum/tourState'
import { interactWithFocus } from '../scene/Interaction'
import { SoundToggle } from './SoundToggle'

const sentence = (prompt: string) => prompt.charAt(0) + prompt.slice(1).toLowerCase()

/**
 * The guided tour's controls. In the lobby: the exhibitions, to choose one. Inside an
 * exhibition: back and next along its route, the action the visitor is facing (what E
 * does when walking), and the way back to the lobby. Large enough for a thumb,
 * reachable by keyboard; the arrow keys move along the route too.
 */
export function GuidedControls({ visible, onPlan }: { visible: boolean; onPlan: () => void }) {
  const route = useTour((state) => state.route)
  const index = useTour((state) => state.index)
  const moving = useTour((state) => state.moving)
  const blocked = useTour((state) => state.blocked)
  const waiting = useTour((state) => state.waiting)
  const prompt = useMuseumStore((state) => state.focus?.prompt ?? null)
  const spaceId = useMuseumStore((state) => state.spaceId)
  const visited = useMuseumStore((state) => state.visited)
  const statuses = useExhibitionStatuses()
  const stops = TOURS[route]
  const stop = stops[index]
  const last = index === stops.length - 1
  const inLobby = route === 'lobby'

  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'ArrowRight') tour.next()
      if (event.code === 'ArrowLeft') tour.previous()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible])

  const hint = waiting
    ? 'Opening the exhibition…'
    : blocked
      ? prompt
        ? `The way on is closed. ${sentence(prompt)} to continue.`
        : 'The way on is closed for now. Give it a moment.'
      : ''

  return (
    <section className={`guided ${visible ? 'guided--visible' : ''}`} aria-hidden={!visible} aria-label="Guided tour">
      <div className="guided__top">
        <SoundToggle />
        <button className="museum-button museum-button--quiet" type="button" onClick={onPlan}>
          Plan
        </button>
        {inLobby ? (
          <button className="museum-button museum-button--quiet guided__leave" type="button" onClick={() => navigation.leave()}>
            Leave
          </button>
        ) : (
          <button className="museum-button museum-button--quiet guided__leave" type="button" onClick={() => navigation.returnToLobby(route, false)} disabled={moving}>
            Lobby
          </button>
        )}
      </div>

      <div className="guided__middle">
        {inLobby && !moving && !waiting && (
          <div className="guided__choices" role="group" aria-label="Exhibitions">
            {EXHIBITIONS.map((exhibition) =>
              exhibition.status === 'open' ? (
                <button key={exhibition.id} className="museum-button" type="button" onClick={() => tour.choose(exhibition.id)}>
                  <span className="meta">
                    {exhibition.number}
                    {visited.includes(exhibition.id) ? ' · visited' : ''}
                  </span>
                  {exhibition.title}
                </button>
              ) : (
                <p key={exhibition.id} className="guided__closed meta">
                  {exhibition.number} {exhibition.title} · in preparation
                </p>
              ),
            )}
          </div>
        )}
        {!inLobby && prompt && !moving && (
          <button className="museum-button" type="button" onClick={() => interactWithFocus()}>
            {sentence(prompt)}
          </button>
        )}
        <p className="guided__hint meta" role="status">
          {hint}
        </p>
      </div>

      <nav className="guided__bar" aria-label="Tour">
        <button className="museum-button museum-button--quiet" type="button" onClick={() => tour.previous()} disabled={inLobby || moving}>
          <span aria-hidden>←</span> {index === 0 && !inLobby ? 'Lobby' : 'Back'}
        </button>
        <div className="guided__stop" aria-live="polite">
          <span className="meta">
            <span className="sr-only">{getSpace(spaceId)?.title}, </span>
            {inLobby ? 'Choose an exhibition' : `${getExhibition(route)?.title} · ${index + 1} / ${stops.length}`}
          </span>
          <span className="guided__title">{stop.title}</span>
        </div>
        <button className="museum-button" type="button" onClick={() => tour.next()} disabled={inLobby || last || moving || (statuses[route] ?? 'open') !== 'open'}>
          Next <span aria-hidden>→</span>
        </button>
      </nav>
      <p className="guided__drag meta" aria-hidden>
        Drag to look around
      </p>
    </section>
  )
}
