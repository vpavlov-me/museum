import { MUSEUM } from '../identity'
import { getSpace } from '../museum/roomRegistry'
import { museumStore, useMuseumStore } from '../museum/store'
import { SoundToggle } from './SoundToggle'

export function Pause({ visible, onResume, onRead }: { visible: boolean; onResume: () => void; onRead: () => void }) {
  const spaceId = useMuseumStore((state) => state.spaceId)

  return (
    <section className={`overlay pause ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} aria-label="Paused">
      <div className="meta">Paused / {getSpace(spaceId)?.hudLabel}</div>
      <button id="resume-museum" className="museum-button" type="button" onClick={onResume}>
        Continue exploring
      </button>
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
