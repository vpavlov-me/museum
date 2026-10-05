import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * Development only: a quiet readout of frame time and render cost in the corner.
 * Writes straight to a DOM node twice a second, never through React. Toggle with `.
 */
export function PerfReadout() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)
  const node = useRef<HTMLDivElement | null>(null)
  const frames = useRef(0)
  const since = useRef(performance.now())
  const worst = useRef(0)
  const last = useRef(performance.now())

  useEffect(() => {
    const element = document.createElement('div')
    element.className = 'perf-readout'
    document.body.appendChild(element)
    node.current = element
    const toggle = (event: KeyboardEvent) => {
      if (event.code === 'Backquote') element.hidden = !element.hidden
    }
    window.addEventListener('keydown', toggle)
    return () => {
      window.removeEventListener('keydown', toggle)
      element.remove()
    }
  }, [])

  useFrame(() => {
    const now = performance.now()
    worst.current = Math.max(worst.current, now - last.current)
    last.current = now
    frames.current++
    const elapsed = now - since.current
    if (elapsed < 500 || !node.current) return

    let lights = 0
    scene.traverseVisible((object) => {
      if ((object as { isLight?: boolean }).isLight) lights++
    })
    const { render, memory, programs } = gl.info
    node.current.textContent = [
      `${Math.round((frames.current * 1000) / elapsed)} fps · worst ${worst.current.toFixed(0)} ms`,
      `${render.calls} calls · ${(render.triangles / 1000).toFixed(1)}k tris`,
      `${memory.geometries} geo · ${memory.textures} tex · ${programs?.length ?? 0} programs · ${lights} lights`,
      `dpr ${gl.getPixelRatio().toFixed(2)}`,
    ].join('\n')
    frames.current = 0
    worst.current = 0
    since.current = now
  })

  return null
}
