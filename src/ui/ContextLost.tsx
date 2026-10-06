import { MUSEUM } from '../identity'

/**
 * The graphics card stopped drawing (a driver reset, a sleeping laptop, too many tabs).
 * Rather than a frozen or black canvas: say so, and offer the two ways on.
 */
export function ContextLost({ visible, onRead }: { visible: boolean; onRead: () => void }) {
  return (
    <section className={`overlay notice ${visible ? 'overlay--visible' : ''}`} aria-hidden={!visible} role="alertdialog" aria-labelledby="lost-title">
      <div className="meta">{MUSEUM.name}</div>
      <h2 id="lost-title">The rooms went dark.</h2>
      <p>The browser stopped drawing the exhibition, usually after the graphics card was reset or the computer slept. Reloading brings the rooms back.</p>
      <div className="notice__actions">
        <button className="museum-button" type="button" onClick={() => window.location.reload()}>
          Reload the exhibition
        </button>
        <button className="text-button meta" type="button" onClick={onRead}>
          Read it as text instead
        </button>
      </div>
    </section>
  )
}
