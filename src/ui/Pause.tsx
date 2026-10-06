import { MUSEUM } from '../identity'
import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'

export function Pause({ visible }: { visible: boolean }) {
  const spaceId = useMuseumStore((state) => state.spaceId)

  return (
    <section className={`overlay pause ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} aria-label="Paused">
      <div className="meta">Paused / {getSpace(spaceId)?.hudLabel}</div>
      <button id="resume-museum" className="museum-button" type="button">
        Continue exploring
      </button>
      <p className="pause__hint meta">W A S D walk · Mouse look · E interact · Esc pause</p>
      <p className="pause__context meta">
        {MUSEUM.name} · An exhibition by {MUSEUM.author} ·{' '}
        <a href={MUSEUM.source} target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </section>
  )
}
