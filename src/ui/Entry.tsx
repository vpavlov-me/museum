import { MUSEUM } from '../identity'

/**
 * The museum's front door. It is also the loading screen: until the rooms are ready
 * the door is closed and says so, without a percentage it could not honestly give.
 * Everything a visitor needs to know before entering is here as real text.
 */
export function Entry({ ready, hidden, onEnter }: { ready: boolean; hidden: boolean; onEnter: () => void }) {
  return (
    <section className={`entry ${ready ? 'entry--ready' : ''} ${hidden ? 'entry--hidden' : ''}`} aria-labelledby="entry-title" aria-hidden={hidden}>
      <header className="entry__top meta">
        <span className="brand">{MUSEUM.name}</span>
        <span>An exhibition in three rooms · {MUSEUM.year}</span>
      </header>

      <div className="entry__main">
        <h1 id="entry-title">{MUSEUM.name}</h1>
        <p className="entry__premise">{MUSEUM.premise}</p>

        <div className="entry__action">
          {/* Pointer lock is requested by the scene's controls when this button is clicked. */}
          <button id="enter-museum" className="museum-button" type="button" disabled={!ready} onClick={onEnter}>
            {ready ? 'Enter exhibition' : 'Opening the rooms'}
            {!ready && <span className="loading-line" aria-hidden />}
          </button>
          <p className="entry__controls meta">W A S D walk · Mouse look · E interact · Esc pause</p>
        </div>
        <span className="sr-only" role="status">
          {ready ? 'The exhibition is ready.' : 'The exhibition is loading.'}
        </span>
        <p className="entry__requirement meta">Made for a desktop browser with a keyboard and mouse.</p>
      </div>

      <footer className="entry__foot meta">
        <ol className="entry__rooms" aria-label="Rooms">
          {MUSEUM.rooms.map(([number, title]) => (
            <li key={number}>
              <span>{number}</span>
              {title}
            </li>
          ))}
        </ol>
        <span>
          By {MUSEUM.author} ·{' '}
          <a href={MUSEUM.source} target="_blank" rel="noreferrer">
            Source
          </a>
        </span>
      </footer>
    </section>
  )
}
