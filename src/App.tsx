import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { Museum, type Exhibit } from './Museum'

function App() {
  const [entered, setEntered] = useState(false)
  const [focusedExhibit, setFocusedExhibit] = useState<Exhibit | null>(null)

  return (
    <main className="app-shell">
      <Canvas
        camera={{ position: [0, 1.7, 12], fov: 68, near: 0.1, far: 100 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <fog attach="fog" args={["#0a0a0a", 14, 34]} />
        <Suspense fallback={null}>
          <Museum active={entered} onFocus={setFocusedExhibit} />
        </Suspense>
      </Canvas>

      <section className={`intro ${entered ? 'intro--hidden' : ''}`}>
        <div className="intro__eyebrow">INTERFACE MUSEUM / PROTOTYPE 01</div>
        <h1>Interfaces,<br />given physical form.</h1>
        <p>
          An experimental exhibition about the objects, conventions and habits
          we use every day without thinking about them.
        </p>
        <button id="enter-museum" type="button" onClick={() => setEntered(true)}>
          Enter exhibition
        </button>
        <div className="intro__hint">Desktop prototype · WASD to move · Mouse to look · Esc to release</div>
      </section>

      <div className={`hud ${entered ? 'hud--visible' : ''}`} aria-hidden={!entered}>
        <div className="hud__brand">INTERFACE MUSEUM</div>
        <div className="hud__room">01 / THE BUTTON</div>
        <div className="crosshair" />
      </div>

      <aside className={`exhibit-card ${focusedExhibit && entered ? 'exhibit-card--visible' : ''}`}>
        {focusedExhibit && (
          <>
            <div className="exhibit-card__meta">{focusedExhibit.year} / {focusedExhibit.category}</div>
            <h2>{focusedExhibit.title}</h2>
            <p>{focusedExhibit.description}</p>
            <div className="exhibit-card__index">OBJECT {focusedExhibit.index}</div>
          </>
        )}
      </aside>

      <Loader
        containerStyles={{ background: '#0a0a0a' }}
        innerStyles={{ background: '#242424' }}
        barStyles={{ background: '#f0eee8' }}
        dataStyles={{ color: '#f0eee8', fontFamily: 'Arial, sans-serif', fontSize: '12px' }}
      />
    </main>
  )
}

export default App
