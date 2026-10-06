import { useEffect, useRef } from 'react'
import { MUSEUM } from '../identity'

/**
 * After the visitor leaves through the exit: the colophon, as a page they can read
 * at leisure, select and follow links from. "Visit again" starts a fresh visit at
 * the entrance (and takes the cursor back, like the entry button).
 */
export function ColophonScreen({ visible, onRestart }: { visible: boolean; onRestart: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)

  // Move focus to the heading once the overlay has faded in (it cannot take focus while hidden).
  useEffect(() => {
    if (!visible) return
    const timer = window.setTimeout(() => heading.current?.focus(), 350)
    return () => window.clearTimeout(timer)
  }, [visible])

  return (
    <section className={`overlay colophon ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} aria-labelledby="colophon-title" role="dialog">
      <div className="colophon__inner">
        <div className="meta">End of exhibition</div>
        <h2 id="colophon-title" ref={heading} tabIndex={-1}>
          Thank you for visiting.
        </h2>
        <p>{MUSEUM.name} is an experimental exhibition about interface culture: the controls, conventions and states we use every day without noticing them, given physical form.</p>
        <ol aria-label="Rooms">
          {MUSEUM.rooms.map(([number, title]) => (
            <li key={number}>
              <span>{number}</span>
              {title}
            </li>
          ))}
        </ol>
        <dl>
          <dt>Exhibition</dt>
          <dd>Conceived, written, designed and built by {MUSEUM.author}, {MUSEUM.year}</dd>
          <dt>Typeface</dt>
          <dd>Inter, by Rasmus Andersson (SIL Open Font License)</dd>
          <dt>Built with</dt>
          <dd>Three.js and React Three Fiber</dd>
        </dl>
        <div className="colophon__actions">
          <button id="restart-museum" className="museum-button" type="button" onClick={onRestart}>
            Visit again
          </button>
          <a className="meta" href={MUSEUM.source} target="_blank" rel="noreferrer">
            Source on GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
