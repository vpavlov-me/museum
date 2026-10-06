import { useEffect, useMemo, useRef, useState } from 'react'
import { EXHIBITIONS, exhibitionOf } from '../museum/exhibitions'
import { DOORS, LOBBY, SPACES } from '../museum/roomRegistry'
import { useMuseumStore, visitor } from '../museum/store'

/*
 * The plan of the museum: a gallery guide, not a minimap. Every space as an outline,
 * each exhibition in its own tone, its number on it, a list beside it, and one quiet
 * mark for where the visitor stands. North is up, as on the walls' signs. It opens
 * over the paused museum (P, or the Plan buttons) and closes back into the visit.
 */

const PAD = 4
const bounds = SPACES.flatMap((space) => space.bounds)
const MIN_X = Math.min(...bounds.map((r) => r.minX)) - PAD
// Room on the right for the YOU ARE HERE label.
const MAX_X = Math.max(...bounds.map((r) => r.maxX)) + PAD + 14
const MIN_Z = Math.min(...bounds.map((r) => r.minZ)) - PAD
const MAX_Z = Math.max(...bounds.map((r) => r.maxZ)) + PAD

const TONE: Record<string, string> = { lobby: 'plan__lobby', permanent: 'plan__permanent', archaeology: 'plan__archaeology' }

/** Names written on the plan, world [x, z]: the permanent exhibition's rooms, and the archaeology wing. */
const LABELS: { text: string; at: [number, number] }[] = [
  { text: 'LOBBY', at: [(LOBBY.minX + LOBBY.maxX) / 2, (LOBBY.minZ + LOBBY.maxZ) / 2] },
  { text: 'ROOM 01', at: [0, 0] },
  { text: 'ROOM 02', at: [-9, -48] },
  { text: 'ROOM 03', at: [-11, -132] },
  { text: 'ARCHAEOLOGY', at: [18, -4] },
]

export function Plan({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const visited = useMuseumStore((state) => state.visited)
  const spaceId = useMuseumStore((state) => state.spaceId)
  const here = exhibitionOf(spaceId)
  const [position, setPosition] = useState({ x: visitor.x, z: visitor.z })
  const back = useRef<HTMLButtonElement>(null)

  // Read where the visitor stands when the plan opens (and while it is open, in case the tour is walking).
  useEffect(() => {
    if (!visible) return
    const read = () => setPosition({ x: visitor.x, z: visitor.z })
    read()
    back.current?.focus()
    const timer = window.setInterval(read, 400)
    return () => window.clearInterval(timer)
  }, [visible])

  useEffect(() => {
    if (!visible) return
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Escape' || event.code === 'KeyP') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [visible, onClose])

  const rooms = useMemo(
    () =>
      SPACES.flatMap((space) =>
        space.bounds.map((r, i) => (
          <rect
            key={`${space.id}:${i}`}
            className={TONE[exhibitionOf(space.id) ?? 'lobby'] ?? 'plan__lobby'}
            x={r.minX - MIN_X}
            y={r.minZ - MIN_Z}
            width={r.maxX - r.minX}
            height={r.maxZ - r.minZ}
          />
        )),
      ),
    [],
  )

  return (
    <section className={`overlay plan ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} aria-labelledby="plan-title" role="dialog">
      <div className="plan__layout">
        <svg className="plan__drawing" viewBox={`0 0 ${MAX_X - MIN_X} ${MAX_Z - MIN_Z}`} role="img" aria-label="Plan of the museum">
          {rooms}
          {/* The temporary exhibition: a door, and nothing behind it yet. */}
          <line className="plan__closed" x1={-9.9 - MIN_X} x2={-8.1 - MIN_X} y1={DOORS.lobbyPermanent.z - MIN_Z} y2={DOORS.lobbyPermanent.z - MIN_Z} />
          {LABELS.map(({ text, at }) => (
            <text key={text} className="plan__label" x={at[0] - MIN_X} y={at[1] - MIN_Z} textAnchor="middle" dominantBaseline="middle">
              {text}
            </text>
          ))}
          <g transform={`translate(${position.x - MIN_X} ${position.z - MIN_Z})`}>
            <circle className="plan__here" r={1.6} />
            <text className="plan__here-label" x={3} y={0.6}>
              YOU ARE HERE
            </text>
          </g>
        </svg>

        <div className="plan__legend">
          <div className="meta">Plan of the museum · north is up</div>
          <h2 id="plan-title">{here ? EXHIBITIONS.find((e) => e.id === here)?.title : 'Lobby'}</h2>
          <ol>
            {EXHIBITIONS.map((exhibition) => (
              <li key={exhibition.id} className={exhibition.id === here ? 'plan__current' : undefined}>
                <span className={`plan__swatch ${TONE[exhibition.id] ?? 'plan__closed-swatch'}`} aria-hidden />
                <span className="plan__number">{exhibition.number}</span>
                <span>
                  {exhibition.title}
                  <span className="meta">
                    {exhibition.status === 'open' ? '' : ' · in preparation'}
                    {visited.includes(exhibition.id) ? ' · visited' : ''}
                    {exhibition.id === here ? ' · you are here' : ''}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <p className="plan__note">
            Every exhibition starts from the lobby and ends at a door back to it. The permanent exhibition (01) is three rooms: 01 The Button, 02 Things We Somehow Accepted, 03 Interface States.
          </p>
          <button id="plan-back" ref={back} className="museum-button" type="button" onClick={onClose}>
            Back to the visit
          </button>
        </div>
      </div>
    </section>
  )
}
