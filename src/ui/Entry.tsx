import { MUSEUM, ROOM_COUNT } from '../identity'
import { SoundToggle } from './SoundToggle'

/**
 * The museum's front door. It is also the loading screen: until the rooms are ready
 * the door is closed and says so, without a percentage it could not honestly give.
 * Everything a visitor needs to know before entering is here as real text.
 */
export function Entry({
  ready,
  hidden,
  recommended,
  onEnter,
  onRead,
}: {
  ready: boolean
  hidden: boolean
  /** Walk on a desktop with a mouse; the guided tour on touch screens. */
  recommended: 'walk' | 'guided'
  onEnter: (mode: 'walk' | 'guided') => void
  onRead: () => void
}) {
  const walk = recommended === 'walk'

  return (
    <section className={`entry ${ready ? 'entry--ready' : ''} ${hidden ? 'entry--hidden' : ''}`} aria-labelledby="entry-title" aria-hidden={hidden}>
      <header className="entry__top meta">
        <span className="brand">{MUSEUM.name}</span>
        <span>
          An exhibition in {ROOM_COUNT} rooms · {MUSEUM.year}
        </span>
      </header>

      <div className="entry__main">
        <h1 id="entry-title">{MUSEUM.name}</h1>
        <p className="entry__premise">{MUSEUM.premise}</p>

        <div className="entry__action">
          {/* Walking: pointer lock is requested by the scene's controls when this button is clicked. */}
          <button
            id={walk ? 'enter-museum' : 'enter-guided'}
            className="museum-button"
            type="button"
            disabled={!ready}
            onClick={() => onEnter(recommended)}
          >
            {!ready ? 'Opening the rooms' : walk ? 'Enter exhibition' : 'Begin the guided tour'}
            {!ready && <span className="loading-line" aria-hidden />}
          </button>
          <p className="entry__controls meta">
            {walk ? 'W A S D walk · Mouse look · E interact · Esc pause · M sound' : 'Drag to look · Next to walk on · Tap the action to use it'}
          </p>
        </div>
        <span className="sr-only" role="status">
          {ready ? 'The exhibition is ready.' : 'The exhibition is loading.'}
        </span>
        <div className="entry__alternatives">
          {walk && (
            <button className="text-button meta" type="button" disabled={!ready} onClick={() => onEnter('guided')}>
              Take the guided tour instead
            </button>
          )}
          <button className="text-button meta" type="button" onClick={onRead}>
            Read the exhibition as text
          </button>
        </div>
        <div className="entry__requirement">
          <p className="meta">
            {walk
              ? 'Made for a desktop browser with a keyboard and mouse. Quiet sound, best with headphones.'
              : 'On this device the exhibition is a guided tour through the same rooms. Quiet sound, best with headphones.'}
          </p>
          <SoundToggle />
        </div>
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
