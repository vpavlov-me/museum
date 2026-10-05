import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'

export function Pause({ visible }: { visible: boolean }) {
  const spaceId = useMuseumStore((state) => state.spaceId)

  return (
    <section className={`pause ${visible ? 'pause--visible' : ''}`} aria-hidden={!visible}>
      <div className="intro__eyebrow">PAUSED / {getSpace(spaceId)?.hudLabel}</div>
      <button id="resume-museum" type="button">
        Continue exploring
      </button>
      <div className="pause__hint">WASD to move · Mouse to look · E to interact · Esc to release</div>
    </section>
  )
}
