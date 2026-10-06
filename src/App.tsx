import { Component, Suspense, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import { sound } from './audio/engine'
import { INK } from './identity'
import { detectCapabilities, type VisitMode } from './museum/capabilities'
import { SPAWN } from './museum/roomRegistry'
import { museumStore, useMuseumStore } from './museum/store'
import { MuseumWorld } from './scene/MuseumWorld'
import { Precompile } from './scene/Precompile'
import { Announcer } from './ui/Announcer'
import { ColophonScreen } from './ui/ColophonScreen'
import { ContextLost } from './ui/ContextLost'
import { Entry } from './ui/Entry'
import { ExhibitCard } from './ui/ExhibitCard'
import { GuidedControls } from './ui/GuidedControls'
import { HUD } from './ui/HUD'
import { Pause } from './ui/Pause'
import { TextExhibition } from './ui/TextExhibition'

/** If the 3D scene cannot start (a WebGL context that fails late), the visitor gets the text, not a blank page. */
class SceneBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

function App() {
  const capabilities = useMemo(detectCapabilities, [])
  // Touch devices are capped a little lower: smaller screens, hotter hardware.
  const sharpest = capabilities.finePointer ? 1.75 : 1.5
  const [webgl, setWebgl] = useState(capabilities.webgl)
  const [mode, setMode] = useState<VisitMode>(capabilities.recommended)
  const [reading, setReading] = useState(!capabilities.webgl)
  const [ready, setReady] = useState(false)
  const [entered, setEntered] = useState(false)
  const [locked, setLocked] = useState(false)
  const [visit, setVisit] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const [lockRefused, setLockRefused] = useState(false)
  const ended = useMuseumStore((state) => state.ended)
  const guided = mode === 'guided'
  // Walking needs the cursor; the guided tour never asks for it.
  const active = entered && !ended && !reading && !contextLost && (guided || locked)

  const markReady = useCallback(() => setReady(true), [])

  // Some browsers, extensions and kiosk modes refuse pointer lock: the pause screen then offers the tour.
  useEffect(() => {
    const refused = () => setLockRefused(true)
    document.addEventListener('pointerlockerror', refused)
    return () => document.removeEventListener('pointerlockerror', refused)
  }, [])

  // Leaving through the exit hands the cursor back for the colophon.
  useEffect(() => {
    if (ended) document.exitPointerLock?.()
  }, [ended])

  // Sound may only start from a click: entering, resuming and visiting again are all clicks.
  const enter = useCallback((chosen: 'walk' | 'guided') => {
    sound.unlock()
    setMode(chosen)
    setEntered(true)
  }, [])

  const restart = useCallback(() => {
    sound.unlock()
    museumStore.reset()
    setVisit((n) => n + 1)
  }, [])

  const sceneFailed = useCallback(() => {
    setWebgl(false)
    setReading(true)
  }, [])

  return (
    <main className="app-shell">
      {webgl && (
        <SceneBoundary onError={sceneFailed}>
          <Canvas
            camera={{ position: SPAWN.position, fov: 60, near: 0.1, far: 100 }}
            dpr={[1, sharpest]}
            gl={{ antialias: true }}
            aria-hidden
            onCreated={({ gl }) =>
              gl.domElement.addEventListener('webglcontextlost', (event) => {
                event.preventDefault()
                setContextLost(true)
              })
            }
          >
            <color attach="background" args={[INK.void]} />
            <fog attach="fog" args={[INK.void, 18, 40]} />
            <Suspense fallback={null}>
              <MuseumWorld
                visit={visit}
                mode={guided && entered ? 'guided' : 'walk'}
                active={active}
                presence={ended || reading ? 'away' : active ? 'visiting' : 'paused'}
                onLockChange={setLocked}
              />
              {/* Mounts once every room and its text are ready; the door opens when their shaders are compiled. */}
              <Precompile onDone={markReady} />
            </Suspense>
          </Canvas>
        </SceneBoundary>
      )}

      <Entry
        ready={ready}
        hidden={entered || reading}
        recommended={capabilities.recommended === 'walk' ? 'walk' : 'guided'}
        onEnter={enter}
        onRead={() => setReading(true)}
      />
      <HUD visible={active} guided={guided} />
      <GuidedControls visible={active && guided} />
      <Pause
        visible={entered && !guided && !locked && !ended && !reading && !contextLost}
        lockRefused={lockRefused}
        onResume={sound.unlock}
        onGuided={() => setMode('guided')}
        onRead={() => setReading(true)}
      />
      <ColophonScreen visible={ended && !reading} onRestart={restart} onRead={() => setReading(true)} />
      <ExhibitCard visible={active} />
      <Announcer active={active} />
      <ContextLost visible={contextLost && !reading} onRead={() => setReading(true)} />
      <TextExhibition visible={reading} canVisit={webgl && !contextLost} onVisit={() => setReading(false)} />
    </main>
  )
}

export default App
