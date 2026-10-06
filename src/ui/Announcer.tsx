import { useEffect, useState } from 'react'
import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'

// Only announce a place once the visitor has settled in it, never while crossing a doorway.
const SETTLE_MS = 700

const speakable = (label: string) => {
  const word = label.split('/').pop()?.trim() ?? label
  return word.charAt(0) + word.slice(1).toLowerCase()
}

/**
 * The museum's structure for screen readers: which room the visitor is in, and the
 * state of the room where the room itself changes (Room 03). Exhibits and prompts are
 * announced by the focus system; walls are not read out while walking.
 */
export function Announcer({ active }: { active: boolean }) {
  const spaceId = useMuseumStore((state) => state.spaceId)
  const zoneId = useMuseumStore((state) => state.zoneId)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!active) return
    const timer = window.setTimeout(() => {
      const space = getSpace(spaceId)
      if (!space) return
      const room = space.number ? `Room ${space.number}: ${space.title}` : space.title
      const zone = space.zones?.find((z) => z.id === zoneId)
      setMessage(zone ? `${room}. ${speakable(zone.label)}.` : `${room}.`)
    }, SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [active, spaceId, zoneId])

  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {active ? message : ''}
    </div>
  )
}
