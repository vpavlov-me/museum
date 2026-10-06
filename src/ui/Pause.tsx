import { MUSEUM } from '../identity'
import type { ExhibitionId } from '../museum/exhibitions'
import { navigation } from '../museum/navigation'
import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'
import { SoundToggle } from './SoundToggle'

export function Pause({
  visible,
  lockRefused,
  exhibition,
  onResume,
  onGuided,
  onPlan,
  onRead,
}: {
  visible: boolean
  /** The browser refused to hand over the cursor: say so, and offer the tour, which does not need it. */
  lockRefused: boolean
  /** The exhibition the visitor is in, or null in the lobby. */
  exhibition: ExhibitionId | null
  onResume: () => void
  onGuided: () => void
  onPlan: () => void
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
      <p className="pause__hint meta">W A S D walk · Mouse look · E interact · P plan · Esc pause · M sound</p>
      <div className="pause__options">
        <SoundToggle />
        <button className="text-button meta" type="button" onClick={onPlan}>
          Plan of the museum
        </button>
        {exhibition && (
          <button className="text-button meta" type="button" onClick={() => navigation.returnToLobby(exhibition, false)}>
            Return to the lobby
          </button>
        )}
        <button className="text-button meta" type="button" onClick={() => navigation.leave()}>
          Leave the museum
        </button>
        <button className="text-button meta" type="button" onClick={onRead}>
          Read as text
        </button>
      </div>
      <p className="pause__context meta">
        {MUSEUM.name} · By {MUSEUM.author} ·{' '}
        <a href={MUSEUM.source} target="_blank" rel="noreferrer">
          Source
        </a>
      </p>
    </section>
  )
}
