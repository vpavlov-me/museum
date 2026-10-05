export function Intro({ hidden, onEnter }: { hidden: boolean; onEnter: () => void }) {
  return (
    <section className={`intro ${hidden ? 'intro--hidden' : ''}`}>
      <div className="intro__eyebrow">INTERFACE MUSEUM / PROTOTYPE 02</div>
      <h1>
        Interfaces,
        <br />
        given physical form.
      </h1>
      <p>An experimental exhibition about the objects, conventions and habits we use every day without thinking about them.</p>
      {/* Pointer lock is requested by the scene's controls when this button is clicked. */}
      <button id="enter-museum" type="button" onClick={onEnter}>
        Enter exhibition
      </button>
      <div className="intro__hint">Desktop prototype · WASD to move · Mouse to look · E to interact · Esc to release</div>
    </section>
  )
}
