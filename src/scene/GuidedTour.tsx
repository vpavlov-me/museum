import { useCallback, useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { motion } from '../museum/capabilities'
import { exhibitions } from '../museum/exhibitionLoader'
import { navigation } from '../museum/navigation'
import { trackVisitor } from '../museum/store'
import { TOURS, type Route } from '../museum/tour'
import { tour } from '../museum/tourState'
import { canOccupy } from './Collision'

/** The tour walks a little faster than a visitor, and stays slightly narrower so it never brushes a door frame. */
const SPEED = 2.6
const RADIUS = 0.3
const LOOK = { yaw: 1.3, pitch: 0.4, sensitivity: 0.005 }

type Path = { points: THREE.Vector2[]; lengths: number[]; total: number; fromYaw: number; toYaw: number; fromPitch: number; toPitch: number }

/** Whether the visitor could walk this polyline right now: the same floor and obstacles as walking. */
function walkable(points: THREE.Vector2[]) {
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]
    const b = points[i]
    const steps = Math.ceil(a.distanceTo(b) / 0.1)
    for (let s = 1; s <= steps; s++) {
      const t = s / steps
      if (!canOccupy(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, RADIUS)) return false
    }
  }
  return true
}

const shortestTurn = (from: number, to: number) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from))

/**
 * The guided tour, for touch screens and for anyone who would rather not steer: the
 * camera walks from stop to stop along the authored route, at a walking pace (or in
 * one cut, if the visitor prefers less motion). Dragging looks around each stop; the
 * tour's action button does what E does.
 */
export function GuidedTour() {
  const camera = useThree((state) => state.camera)
  const element = useThree((state) => state.gl.domElement)
  const path = useRef<Path | null>(null)
  const travelled = useRef(0)
  const baseYaw = useRef(0)
  const basePitch = useRef(0)
  const look = useRef({ yaw: 0, pitch: 0 })

  /** Stands at a stop at once: the start of a visit, and the return to the lobby. */
  const place = useCallback(
    (route: Route) => {
      tour.reset(route)
      const stop = TOURS[route][0]
      const [x, z] = stop.at
      path.current = null
      camera.position.x = x
      camera.position.z = z
      baseYaw.current = stop.yaw
      basePitch.current = stop.pitch ?? 0
      look.current = { yaw: 0, pitch: 0 }
      trackVisitor(x, z)
    },
    [camera],
  )

  // Every guided visit begins in the lobby, or at the first stop of the exhibition a link names.
  useEffect(() => {
    const target = navigation.target
    place(target ?? 'lobby')
  }, [place])

  // Drag to look around, within limits: the stop chooses the view, the visitor adjusts it.
  useEffect(() => {
    let dragging: number | null = null
    let last = { x: 0, y: 0 }
    const down = (event: PointerEvent) => {
      dragging = event.pointerId
      last = { x: event.clientX, y: event.clientY }
      element.setPointerCapture(event.pointerId)
    }
    const move = (event: PointerEvent) => {
      if (dragging !== event.pointerId) return
      const { yaw, pitch } = look.current
      look.current = {
        yaw: THREE.MathUtils.clamp(yaw + (event.clientX - last.x) * LOOK.sensitivity, -LOOK.yaw, LOOK.yaw),
        pitch: THREE.MathUtils.clamp(pitch + (event.clientY - last.y) * LOOK.sensitivity, -LOOK.pitch, LOOK.pitch),
      }
      last = { x: event.clientX, y: event.clientY }
    }
    const up = (event: PointerEvent) => {
      if (dragging === event.pointerId) dragging = null
    }
    element.style.touchAction = 'none'
    element.addEventListener('pointerdown', down)
    element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', up)
    element.addEventListener('pointercancel', up)
    return () => {
      element.style.touchAction = ''
      element.removeEventListener('pointerdown', down)
      element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', up)
      element.removeEventListener('pointercancel', up)
    }
  }, [element])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    // Back to the lobby from an exhibition's last door.
    if (navigation.takeMove()?.lobby) place('lobby')
    const { route, index, request } = tour.get()

    if (request !== null && !path.current) {
      // Into an exhibition whose rooms are still on their way: wait at its shut door.
      if (request.route !== 'lobby' && exhibitions.status(request.route) !== 'open') {
        exhibitions.request(request.route)
        if (!tour.get().waiting) tour.set({ waiting: true })
        return
      }
      const forward = request.route === route ? request.index > index : route === 'lobby'
      const stop = TOURS[request.route][request.index]
      // Forward: through the next stop's waypoints. Back: the same way, reversed.
      const via = forward ? (stop.via ?? []) : [...(TOURS[route][index].via ?? [])].reverse()
      const points = [new THREE.Vector2(camera.position.x, camera.position.z), ...[...via, stop.at].map(([x, z]) => new THREE.Vector2(x, z))]
      if (!walkable(points)) {
        tour.set({ request: null, blocked: true, waiting: false })
      } else {
        const lengths = points.slice(1).map((p, i) => p.distanceTo(points[i]))
        const fromYaw = baseYaw.current + look.current.yaw
        const fromPitch = basePitch.current + look.current.pitch
        path.current = { points, lengths, total: lengths.reduce((a, b) => a + b, 0), fromYaw, toYaw: shortestTurn(fromYaw, stop.yaw), fromPitch, toPitch: stop.pitch ?? 0 }
        travelled.current = motion.reduced ? Number.POSITIVE_INFINITY : 0
        look.current = { yaw: 0, pitch: 0 }
        tour.set({ request: null, route: request.route, index: request.index, moving: true, blocked: false, waiting: false })
      }
    }

    const current = path.current
    if (current) {
      travelled.current += SPEED * delta
      let left = Math.min(travelled.current, current.total)
      let i = 0
      while (i < current.lengths.length - 1 && left > current.lengths[i]) left -= current.lengths[i++]
      const a = current.points[i]
      const b = current.points[i + 1]
      const t = current.lengths[i] > 0 ? Math.min(1, left / current.lengths[i]) : 1
      camera.position.x = a.x + (b.x - a.x) * t
      camera.position.z = a.y + (b.y - a.y) * t
      const progress = current.total > 0 ? Math.min(1, travelled.current / current.total) : 1
      const eased = THREE.MathUtils.smoothstep(progress, 0, 1)
      baseYaw.current = THREE.MathUtils.lerp(current.fromYaw, current.toYaw, eased)
      basePitch.current = THREE.MathUtils.lerp(current.fromPitch, current.toPitch, eased)
      trackVisitor(camera.position.x, camera.position.z)
      if (progress >= 1) {
        path.current = null
        tour.set({ moving: false })
      }
    }

    camera.rotation.set(basePitch.current + look.current.pitch, baseYaw.current + look.current.yaw, 0, 'YXZ')
  })

  return null
}
