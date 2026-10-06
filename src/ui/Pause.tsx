import { MUSEUM } from '../identity'
import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'
import { SoundToggle } from './SoundToggle'

export function Pause({ visible, onResume }: { visible: boolean; onResume: () => void }) {
  const spaceId = useMuseumStore((state) => state.spaceId)

  return (
    <section className={`overlay pause ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} aria-label="Paused">
      <div className="meta">Paused / {getSpace(spaceId)?.hudLabel}</div>
      <button id="resume-museum" className="museum-button" type="button" onClick={onResume}>
        Continue exploring
      </button>
      <p className="pause__hint meta">W A S D walk · Mouse look · E interact · Esc pause · M sound</p>
      <SoundToggle />
      <p className="pause__context meta">
        {MUSEUM.name} · An exhibition by {MUSEUM.author} ·{' '}
        <a href={MUSEUM.source} target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </section>
  )
}
