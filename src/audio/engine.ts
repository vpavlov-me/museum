import { useSyncExternalStore } from 'react'

/*
 * The museum's sound, on native Web Audio. Every sound is synthesised in code:
 * there are no audio files, so nothing to license and nothing to download.
 *
 * Lifecycle: no AudioContext exists until `unlock()` is called from a click (the
 * entry, resume and "visit again" buttons), so the browser never blocks or warns.
 * One master gain carries mute, the pause duck and the fade at the end of a visit;
 * the context is suspended while the tab is hidden.
 */

const STORAGE_KEY = 'interface-museum:muted'
/** Master level when sound is on: conservative, the room tone should be felt more than heard. */
const VOLUME = 0.7
/** How loud the museum is while the visitor is walking, paused, or has left. */
const PRESENCE_LEVEL = { visiting: 1, paused: 0.35, away: 0 }
export type Presence = keyof typeof PRESENCE_LEVEL

export type Vec3 = [number, number, number]

function readMuted() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

let context: AudioContext | null = null
let master: GainNode | null = null
let sfxBus: GainNode | null = null
let ambienceBus: GainNode | null = null
let muted = readMuted()
let presence: Presence = 'paused'
let voices = 0
let unavailable = typeof window === 'undefined' || typeof window.AudioContext === 'undefined'
const subscribers = new Set<() => void>()
const unlockedCallbacks = new Set<(context: AudioContext) => void>()

function level() {
  return muted ? 0 : VOLUME * PRESENCE_LEVEL[presence]
}

function applyLevel(seconds = 0.4) {
  if (!context || !master) return
  master.gain.setTargetAtTime(level(), context.currentTime, seconds / 3)
}

function onVisibility() {
  if (!context) return
  const change = document.hidden ? context.suspend() : context.resume()
  change.catch(() => undefined)
}

export const sound = {
  /** Creates (once) and resumes the audio context. Call only from a user gesture. */
  unlock() {
    // Sound is optional: a browser without Web Audio (or one that refuses it) gets a silent museum.
    if (unavailable) return
    if (!context) {
      try {
        context = new AudioContext({ latencyHint: 'interactive' })
      } catch {
        unavailable = true
        return
      }
      master = context.createGain()
      master.gain.value = 0
      master.connect(context.destination)
      sfxBus = context.createGain()
      sfxBus.connect(master)
      ambienceBus = context.createGain()
      ambienceBus.connect(master)
      document.addEventListener('visibilitychange', onVisibility)
      const created = context
      unlockedCallbacks.forEach((callback) => callback(created))
    }
    context.resume().catch(() => undefined)
    applyLevel(1.5)
  },

  /** Runs once the context exists (immediately, if it already does). */
  onUnlock(callback: (context: AudioContext) => void) {
    if (context) callback(context)
    else unlockedCallbacks.add(callback)
    return () => {
      unlockedCallbacks.delete(callback)
    }
  },

  get context() {
    return context
  },
  get sfx() {
    return sfxBus
  },
  get ambience() {
    return ambienceBus
  },

  get muted() {
    return muted
  },
  setMuted(value: boolean) {
    muted = value
    try {
      localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
    } catch {
      // Private browsing: the preference simply lasts for this page.
    }
    applyLevel(0.3)
    subscribers.forEach((subscriber) => subscriber())
  },
  toggleMuted() {
    sound.setMuted(!muted)
  },

  /** Walking: full level. Paused: ducked. Away (the visit has ended): silent. */
  setPresence(value: Presence) {
    if (value === presence) return
    presence = value
    applyLevel(value === 'away' ? 3 : 0.8)
  },

  /** Development: how many one-shot voices are sounding right now. */
  get voices() {
    return voices
  },
  voiceStarted() {
    voices++
  },
  voiceEnded() {
    voices--
  },

  subscribe(subscriber: () => void) {
    subscribers.add(subscriber)
    return () => {
      subscribers.delete(subscriber)
    }
  },
}

export function useMuted() {
  return useSyncExternalStore(sound.subscribe, () => sound.muted)
}
