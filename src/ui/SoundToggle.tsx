import { sound, useMuted } from '../audio/engine'

/** Sound on or off: remembered by this browser, and never switched back on for you. `M` does the same. */
export function SoundToggle() {
  const muted = useMuted()
  return (
    <button className="sound-toggle meta" type="button" aria-pressed={!muted} onClick={() => sound.toggleMuted()}>
      <span className={`sound-toggle__mark ${muted ? '' : 'sound-toggle__mark--on'}`} aria-hidden />
      {muted ? 'Sound off' : 'Sound on'}
    </button>
  )
}
