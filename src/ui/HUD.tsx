import { MUSEUM } from '../identity'
import { getSpace } from '../museum/roomRegistry'
import { useMuseumStore } from '../museum/store'

export function HUD({ visible }: { visible: boolean }) {
  const spaceId = useMuseumStore((state) => state.spaceId)
  const zoneId = useMuseumStore((state) => state.zoneId)
  const space = getSpace(spaceId)
  const zone = space?.zones?.find((z) => z.id === zoneId)?.label ?? null
  const prompt = useMuseumStore((state) => state.focus?.prompt ?? null)

  return (
    <div className={`hud ${visible ? 'hud--visible' : ''}`} aria-hidden={!visible}>
      <div className="hud__brand meta">{MUSEUM.name}</div>
      <div className="hud__room meta">
        {space?.hudLabel}
        <span className={`hud__zone ${zone ? 'hud__zone--visible' : ''}`}>{zone ?? ''}</span>
      </div>
      <div className="crosshair" />
      <div className={`hud__prompt meta ${prompt ? 'hud__prompt--visible' : ''}`}>
        <span className="hud__key">E</span>
        <span>{prompt ?? ''}</span>
      </div>
      <div className="hud__hint meta">Esc to pause</div>
    </div>
  )
}
