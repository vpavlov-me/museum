import { useFading } from '../museum/navigation'

/** A short fade to the void and back, while the visitor is moved back to the lobby. */
export function Fade() {
  const fading = useFading()
  return <div className={`fade ${fading ? 'fade--on' : ''}`} aria-hidden />
}
