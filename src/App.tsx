import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Loader } from '@react-three/drei'
import { SPAWN } from './museum/roomRegistry'
import { MuseumWorld } from './scene/MuseumWorld'
import { ExhibitCard } from './ui/ExhibitCard'
import { HUD } from './ui/HUD'
import { Intro } from './ui/Intro'
import { Pause } from './ui/Pause'

function App() {
  const [entered, setEntered] = useState(false)
  const [locked, setLocked] = useState(false)
  const active = entered && locked

  return (
    <main className="app-shell">
      <Canvas camera={{ position: SPAWN.position, fov: 60, near: 0.1, far: 100 }} dpr={[1, 1.75]} gl={{ antialias: true }}>
        <color attach="background" args={['#0a0a0a']} />
        <fog attach="fog" args={['#0a0a0a', 18, 40]} />
        <Suspense fallback={null}>
          <MuseumWorld active={active} onLockChange={setLocked} />
        </Suspense>
      </Canvas>

      <Intro hidden={entered} onEnter={() => setEntered(true)} />
      <HUD visible={active} />
      <Pause visible={entered && !locked} />
      <ExhibitCard visible={active} />

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
