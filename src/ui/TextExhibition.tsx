import { useEffect, useRef } from 'react'
import { MUSEUM } from '../identity'
import { EXHIBITIONS, OPEN_EXHIBITIONS } from '../museum/exhibitions'
import { AFTERWORD, FINDS, INSTITUTE, THESIS as ARCHAEOLOGY_THESIS } from '../rooms/archaeology/content'
import { AFTERWORD as DARK_AFTERWORD, CONFIRMSHAMING, FLOW, PATTERNS, RECEIPT, THESIS as DARK_THESIS, TOTAL } from '../rooms/dark-patterns/content'
import { CARDS as ACCEPTED, CHAPTERS as ACCEPTED_CHAPTERS, OBSERVATIONS, THESIS as ACCEPTED_THESIS } from '../rooms/accepted/content'
import { CHAPTERS as STATES, THESIS as STATES_THESIS } from '../rooms/states/content'
import { EXHIBITS, WALL_TEXTS } from '../rooms/the-button/content'

type Entry = { kicker: string; title: string; body: string }

/** The permanent exhibition: the same words as on the walls, in the order a visitor meets them. */
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

/** Interface Archaeology: one room in four cells, the archive's readings with what each thing was. */
const ARCHAEOLOGY = {
  idea: 'The interface outside its own time. Our interfaces as a future archive finds and catalogues them: a hall around an excavation, a store of numbered boxes and vitrines, and a reconstruction of a dwelling. The archive writes the labels. After each of its readings, in brackets, is what the thing was.',
  entries: [
    ARCHAEOLOGY_THESIS,
    { kicker: 'THE ARCHIVE / SIGN', title: `${INSTITUTE.name}: ${INSTITUTE.gallery}, ${INSTITUTE.dates}`, body: INSTITUTE.line },
    ...Object.values(FINDS).map((find) => ({
      kicker: `${find.accession} / ${find.layer}`,
      title: find.name,
      body: `${find.reading} [${find.was}]`,
    })),
    AFTERWORD,
  ],
}

const pattern = (p: { name: string; text: string; also?: string }) => ({ kicker: p.also ? `PATTERN / ${p.also.toUpperCase()}` : 'PATTERN', title: p.name, body: p.text })

/** Dark Patterns: the shop's signs, in the order a visitor meets them, each followed by the museum's label. */
const DARK_PATTERNS = {
  idea: 'The temporary exhibition: interfaces designed against the people using them, walked as a purchase and a cancellation. The shop’s signs use the patterns on the visitor; small labels, in the museum’s voice, name them.',
  entries: [
    DARK_THESIS,
    { kicker: 'I / WELCOME', title: 'This exhibition closes in 00:59', body: 'A countdown that starts again every time it runs out, over a line that says how many people are looking at this room right now: a number that drifts up and down.' },
    pattern(PATTERNS.urgency),
    pattern(PATTERNS.social),
    {
      kicker: 'II / CHECKOUT',
      title: 'A free ticket',
      body: `Along the counter the fees appear one at a time as you walk: ${RECEIPT.map((line) => `${line.item} ${line.price === 0 ? 'free' : `€${line.price.toFixed(2)}`}${line.note && line.price > 0 ? ' (pre-selected)' : ''}`).join(', ')}. Total: €${TOTAL.toFixed(2)}. On a stand, a box ticked for you, “Add booking protection”: untick it and it ticks itself again.`,
    },
    pattern(PATTERNS.drip),
    pattern(PATTERNS.basket),
    { kicker: 'III / LEAVING', title: 'Two doors', body: `A large door, framed in light, under a button: “${CONFIRMSHAMING.stay}”. It leads to a small bright room: “${CONFIRMSHAMING.thanks}” At the far end of the counter, a small door, and in small grey type: “${CONFIRMSHAMING.leave}”.` },
    pattern(PATTERNS.shaming),
    { kicker: 'III / LEAVING', title: 'The cancellation flow', body: `Behind the small door, a corridor folded four times, with a screen at each turn. ${FLOW.map((screen) => `“${screen.title}” ${screen.body} [${screen.yes} / ${screen.no}]`).join(' ')}` },
    pattern(PATTERNS.motel),
    DARK_AFTERWORD,
  ],
}

const COUNT = ['One', 'Two', 'Three', 'Four', 'Five'][OPEN_EXHIBITIONS.length - 1]

function Entries({ entries, level }: { entries: Entry[]; level: 3 | 4 }) {
  const Heading = level === 3 ? 'h3' : 'h4'
  return (
    <>
      {entries.map((entry) => (
        <section key={entry.title} className="text-exhibition__entry">
          <div className="meta">{entry.kicker}</div>
          <Heading>{entry.title}</Heading>
          <p>{entry.body}</p>
        </section>
      ))}
    </>
  )
}

/**
 * The museum as a page: for browsers without WebGL, for screen-reader users, and
 * for anyone who would rather read. Each exhibition is its own section. It is not a
 * summary; it is every text on the walls.
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
        <div className="meta">
          {COUNT} exhibitions · {MUSEUM.year}
        </div>
        <h1 id="text-title" ref={heading} tabIndex={-1}>
          {MUSEUM.name}
        </h1>
        <p className="text-exhibition__premise">{MUSEUM.premise}</p>
        <p className="text-exhibition__note">
          {canVisit
            ? 'This is the museum as text: each exhibition, every wall and label in order. The full museum is a building to walk through in 3D.'
            : 'The full museum is a building to walk through in 3D, which needs a browser with WebGL. This is the same museum as text: each exhibition, every wall and label in order.'}
        </p>
        <nav aria-label="Exhibitions">
          <ol className="text-exhibition__list">
            {EXHIBITIONS.map((exhibition) => (
              <li key={exhibition.id}>
                <span className="meta">{exhibition.number}</span>{' '}
                {exhibition.status === 'open' ? <a href={`#exhibition-${exhibition.id}`}>{exhibition.title}</a> : exhibition.title}
                <span className="meta"> · {exhibition.status === 'open' ? exhibition.subtitle : 'in preparation'}</span>
              </li>
            ))}
          </ol>
        </nav>
        {canVisit && (
          <button className="museum-button" type="button" onClick={onVisit}>
            Back to the museum
          </button>
        )}
      </header>

      <section id="exhibition-permanent" className="text-exhibition__room" aria-labelledby="exhibition-permanent-title">
        <div className="meta">Exhibition 01</div>
        <h2 id="exhibition-permanent-title">Permanent Exhibition</h2>
        <p className="text-exhibition__idea">{EXHIBITIONS[0].subtitle} The interface as an object, as architecture, and as the state of the world.</p>
        {ROOMS.map((room) => (
          <section key={room.number} className="text-exhibition__subroom" aria-labelledby={`room-${room.number}`}>
            <div className="meta">Room {room.number}</div>
            <h3 id={`room-${room.number}`}>{room.title}</h3>
            <p className="text-exhibition__idea">{room.idea}</p>
            <Entries entries={room.entries} level={4} />
          </section>
        ))}
      </section>

      <section id="exhibition-archaeology" className="text-exhibition__room" aria-labelledby="exhibition-archaeology-title">
        <div className="meta">Exhibition 02</div>
        <h2 id="exhibition-archaeology-title">Interface Archaeology</h2>
        <p className="text-exhibition__idea">{ARCHAEOLOGY.idea}</p>
        <Entries entries={ARCHAEOLOGY.entries} level={3} />
      </section>

      <section id="exhibition-dark-patterns" className="text-exhibition__room" aria-labelledby="exhibition-dark-patterns-title">
        <div className="meta">Temporary exhibition 03</div>
        <h2 id="exhibition-dark-patterns-title">Dark Patterns</h2>
        <p className="text-exhibition__idea">{DARK_PATTERNS.idea}</p>
        <Entries entries={DARK_PATTERNS.entries} level={3} />
      </section>

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
