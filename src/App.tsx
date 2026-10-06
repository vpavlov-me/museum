import { Suspense, useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { INK } from './identity'
import { SPAWN } from './museum/roomRegistry'
import { museumStore, useMuseumStore } from './museum/store'
import { MuseumWorld } from './scene/MuseumWorld'
import { ColophonScreen } from './ui/ColophonScreen'
import { Entry } from './ui/Entry'
import { ExhibitCard } from './ui/ExhibitCard'
import { HUD } from './ui/HUD'
import { Pause } from './ui/Pause'

/** Rendered inside the scene's Suspense boundary, so it mounts only once every room (and its text) is ready. */
function Ready({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    // Give the first frames a moment to lay out their text before the door opens.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(onReady)
    })
    return () => cancelAnimationFrame(frame)
  }, [onReady])
  return null
}

function App() {
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [locked, setLocked] = useState(false)
  const [visit, setVisit] = useState(0)
  const ended = useMuseumStore((state) => state.ended)
  const active = entered && locked && !ended

  const markReady = useCallback(() => setReady(true), [])

  // Leaving through the exit hands the cursor back for the colophon.
  useEffect(() => {
    if (ended) document.exitPointerLock?.()
  }, [ended])

  const restart = useCallback(() => {
    museumStore.reset()
    setVisit((n) => n + 1)
  }, [])

  return (
    <main className="app-shell">
      <Canvas camera={{ position: SPAWN.position, fov: 60, near: 0.1, far: 100 }} dpr={[1, 1.75]} gl={{ antialias: true }} aria-hidden>
        <color attach="background" args={[INK.void]} />
        <fog attach="fog" args={[INK.void, 18, 40]} />
        <Suspense fallback={null}>
          <MuseumWorld visit={visit} active={active} onLockChange={setLocked} />
          <Ready onReady={markReady} />
        </Suspense>
      </Canvas>

      <Entry ready={ready} hidden={entered} onEnter={() => setEntered(true)} />
      <HUD visible={active} />
      <Pause visible={entered && !locked && !ended} />
      <ColophonScreen visible={ended} onRestart={restart} />
      <ExhibitCard visible={active} />
    </main>
  )
}

export default App
