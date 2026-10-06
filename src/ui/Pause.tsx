import { MUSEUM } from '../identity'
import { getSpace } from '../museum/roomRegistry'
import { museumStore, useMuseumStore } from '../museum/store'
import { SoundToggle } from './SoundToggle'

export function Pause({
  visible,
  lockRefused,
  onResume,
  onGuided,
  onRead,
}: {
  visible: boolean
  /** The browser refused to hand over the cursor: say so, and offer the tour, which does not need it. */
  lockRefused: boolean
  onResume: () => void
  onGuided: () => void
  onRead: () => void
}) {
  const spaceId = useMuseumStore((state) => state.spaceId)

  return (
    <section className={`overlay pause ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} aria-label="Paused">
      <div className="meta">Paused / {getSpace(spaceId)?.hudLabel}</div>
      <button id="resume-museum" className="museum-button" type="button" onClick={onResume}>
        Continue exploring
      </button>
      {lockRefused && (
        <p className="pause__refused">
          This browser did not hand over the cursor, which walking needs. The guided tour works without it.{' '}
          <button className="text-button meta" type="button" onClick={onGuided}>
            Take the guided tour
          </button>
        </p>
      )}
      <p className="pause__hint meta">W A S D walk · Mouse look · E interact · Esc pause · M sound</p>
      <div className="pause__options">
        <SoundToggle />
        <button className="text-button meta" type="button" onClick={() => museumStore.set({ ended: true })}>
          Leave the exhibition
        </button>
        <button className="text-button meta" type="button" onClick={onRead}>
          Read as text
        </button>
      </div>
      <p className="pause__context meta">
        {MUSEUM.name} · An exhibition by {MUSEUM.author} ·{' '}
        <a href={MUSEUM.source} target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </section>
  )
}
