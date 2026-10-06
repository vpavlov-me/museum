import { useEffect, useRef } from 'react'
import { MUSEUM } from '../identity'
import { CARDS as ACCEPTED, CHAPTERS as ACCEPTED_CHAPTERS, OBSERVATIONS, THESIS as ACCEPTED_THESIS } from '../rooms/accepted/content'
import { CHAPTERS as STATES, THESIS as STATES_THESIS } from '../rooms/states/content'
import { EXHIBITS, WALL_TEXTS } from '../rooms/the-button/content'

type Entry = { kicker: string; title: string; body: string }

/** The same words as on the walls, in the order a visitor meets them. */
const ROOMS: { number: string; title: string; idea: string; entries: Entry[] }[] = [
  {
    number: '01',
    title: 'The Button',
    idea: 'Interface as an object. Four buttons on four plinths, from 1995 to 2026.',
    entries: [
      ...WALL_TEXTS.slice(0, 1).map((text) => ({ kicker: text.kicker, title: text.title, body: text.body })),
      ...EXHIBITS.map((exhibit) => ({ kicker: `${exhibit.year} / ${exhibit.category}`, title: exhibit.title, body: exhibit.description })),
      ...WALL_TEXTS.slice(1).map((text) => ({ kicker: text.kicker, title: text.title, body: text.body })),
    ],
  },
  {
    number: '02',
    title: 'Things We Somehow Accepted',
    idea: 'Interface behavior as architecture. A cookie banner across the room, modals that dim it, badges on every surface, a CAPTCHA gate, skeleton panels in the way and a feed with no end.',
    entries: [
      ACCEPTED_THESIS,
      ...[ACCEPTED.banner, ACCEPTED.modal].map((card) => ({ kicker: `${ACCEPTED_CHAPTERS.interrupt.name} / ${card.year}`, title: card.title, body: card.description })),
      ...[ACCEPTED.badge, ACCEPTED.captcha].map((card) => ({ kicker: `${ACCEPTED_CHAPTERS.attend.name.replace('\n', ' ')} / ${card.year}`, title: card.title, body: card.description })),
      OBSERVATIONS.badges,
      ...[ACCEPTED.skeleton, ACCEPTED.feed].map((card) => ({ kicker: `${ACCEPTED_CHAPTERS.wait.name.replace('\n', ' ')} / ${card.year}`, title: card.title, body: card.description })),
      OBSERVATIONS.waiting,
    ],
  },
  {
    number: '03',
    title: 'Interface States',
    idea: 'Interface state as the state of the world. A room that has not finished loading, a room with nothing in it, a room built wrongly, a room that loses its connection and its light, and a room where everything is done.',
    entries: [
      STATES_THESIS,
      ...[STATES.loading, STATES.empty, STATES.error, STATES.offline, STATES.success].map((chapter) => ({
        kicker: `STATE ${chapter.numeral}`,
        title: chapter.name.replace('\n', ' '),
        body: chapter.line,
      })),
    ],
  },
]

/**
 * The exhibition as a page: for browsers without WebGL, for screen-reader users, and
 * for anyone who would rather read. It is not a summary; it is every text on the walls.
 */
export function TextExhibition({ visible, canVisit, onVisit }: { visible: boolean; canVisit: boolean; onVisit: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (visible) heading.current?.focus()
  }, [visible])

  if (!visible) return null

  return (
    <article className="text-exhibition" aria-labelledby="text-title">
      <header className="text-exhibition__head">
        <div className="meta">An exhibition in three rooms · {MUSEUM.year}</div>
        <h1 id="text-title" ref={heading} tabIndex={-1}>
          {MUSEUM.name}
        </h1>
        <p className="text-exhibition__premise">{MUSEUM.premise}</p>
        <p className="text-exhibition__note">
          {canVisit
            ? 'This is the exhibition as text: every wall, label and room in order. The full exhibition is a walk through three rooms in 3D.'
            : 'The full exhibition is a walk through three rooms in 3D, which needs a browser with WebGL. This is the same exhibition as text: every wall, label and room in order.'}
        </p>
        {canVisit && (
          <button className="museum-button" type="button" onClick={onVisit}>
            Back to the exhibition
          </button>
        )}
      </header>

      {ROOMS.map((room) => (
        <section key={room.number} className="text-exhibition__room" aria-labelledby={`room-${room.number}`}>
          <div className="meta">Room {room.number}</div>
          <h2 id={`room-${room.number}`}>{room.title}</h2>
          <p className="text-exhibition__idea">{room.idea}</p>
          {room.entries.map((entry) => (
            <section key={entry.title} className="text-exhibition__entry">
              <div className="meta">{entry.kicker}</div>
              <h3>{entry.title}</h3>
              <p>{entry.body}</p>
            </section>
          ))}
        </section>
      ))}

      <footer className="text-exhibition__foot">
        <p>
          Conceived, written, designed and built by {MUSEUM.author}, {MUSEUM.year}. Set in Inter by Rasmus Andersson.
        </p>
        <a className="meta" href={MUSEUM.source} target="_blank" rel="noreferrer">
          Source on GitHub
        </a>
      </footer>
    </article>
  )
}
