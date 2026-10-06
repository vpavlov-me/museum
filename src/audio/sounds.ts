import { noise, renderLoop, tone, type Recipe } from './synth'

/*
 * Every sound the museum makes, by room. Deliberate acts (E) are a little louder
 * than things that happen as the visitor walks; nothing is louder than a quiet
 * room needs. Durations are returned so each voice can release itself.
 */
export const SOUNDS = {
  // Room 01: each era answers a press in its own material, and only slightly.
  'button-bevel': (c, out, t) => {
    noise(c, out, t, { duration: 0.05, gain: 0.16, filter: 'bandpass', freq: 1400, q: 1.2 })
    return tone(c, out, t, { freq: 140, to: 90, duration: 0.09, gain: 0.22 })
  },
  'button-gloss': (c, out, t) => {
    tone(c, out, t, { freq: 1040, to: 720, duration: 0.12, gain: 0.025, attack: 0.008 })
    return tone(c, out, t, { freq: 520, to: 360, duration: 0.15, gain: 0.11, attack: 0.008 })
  },
  'button-flat': (c, out, t) => noise(c, out, t, { duration: 0.016, gain: 0.09, filter: 'highpass', freq: 3800 }),
  'button-quiet': (c, out, t) => {
    noise(c, out, t, { duration: 0.12, gain: 0.025, filter: 'bandpass', freq: 2500, q: 0.7, attack: 0.04 })
    return tone(c, out, t, { freq: 880, duration: 0.28, gain: 0.01, attack: 0.05 })
  },

  // Room 02: friction, kept small. Modals and badges arrive on their own, so they are the quietest.
  'banner-accept': (c, out, t) => {
    tone(c, out, t, { freq: 70, to: 45, duration: 1, gain: 0.05, attack: 0.08 })
    return noise(c, out, t, { duration: 1.1, gain: 0.1, filter: 'lowpass', freq: 500, to: 70, attack: 0.05 })
  },
  'modal-open': (c, out, t) => {
    noise(c, out, t, { duration: 0.05, gain: 0.03, filter: 'lowpass', freq: 600 })
    return tone(c, out, t, { freq: 170, duration: 0.08, gain: 0.06 })
  },
  'modal-close': (c, out, t) => {
    noise(c, out, t, { duration: 0.02, gain: 0.045, filter: 'highpass', freq: 2500 })
    return tone(c, out, t, { freq: 300, to: 220, duration: 0.06, gain: 0.03 })
  },
  badge: (c, out, t) => tone(c, out, t, { freq: 1760, duration: 0.035, gain: 0.008 }),
  'badges-clear': (c, out, t) => noise(c, out, t, { duration: 0.35, gain: 0.04, filter: 'bandpass', freq: 1800, to: 600, attack: 0.02 }),
  'captcha-check': (c, out, t) => {
    tone(c, out, t, { freq: 660, duration: 0.08, gain: 0.035 })
    return tone(c, out, t, { freq: 660, duration: 0.08, gain: 0.03, delay: 0.2 })
  },
  'captcha-retry': (c, out, t) => {
    tone(c, out, t, { freq: 330, duration: 0.12, gain: 0.045 })
    return tone(c, out, t, { freq: 311, duration: 0.2, gain: 0.04, delay: 0.15 })
  },
  'captcha-pass': (c, out, t) => {
    tone(c, out, t, { freq: 523, duration: 0.1, gain: 0.035 })
    tone(c, out, t, { freq: 784, duration: 0.22, gain: 0.035, delay: 0.12 })
    return noise(c, out, t, { duration: 1, gain: 0.05, filter: 'lowpass', freq: 300, attack: 0.2, delay: 0.5 })
  },

  // Room 03: the states.
  'loading-done': (c, out, t) => {
    tone(c, out, t, { freq: 392, duration: 0.6, gain: 0.03, attack: 0.03 })
    return tone(c, out, t, { freq: 588, duration: 0.7, gain: 0.018, attack: 0.05, delay: 0.04 })
  },
  'barrier-sink': (c, out, t) => noise(c, out, t, { duration: 1, gain: 0.07, filter: 'lowpass', freq: 400, to: 60, attack: 0.05 }),
  'error-retrying': (c, out, t) => noise(c, out, t, { duration: 0.9, gain: 0.014, filter: 'bandpass', freq: 900, q: 4, attack: 0.25 }),
  // A failure you feel in the floor rather than hear as an alarm: low, slightly out of tune with itself.
  'error-fail': (c, out, t) => {
    tone(c, out, t, { freq: 98, duration: 0.3, gain: 0.09 })
    tone(c, out, t, { freq: 104, duration: 0.4, gain: 0.05 })
    return noise(c, out, t, { duration: 0.15, gain: 0.05, filter: 'lowpass', freq: 250 })
  },
  // The slab slides home and settles.
  'error-resolve': (c, out, t) => {
    noise(c, out, t, { duration: 1.6, gain: 0.06, filter: 'lowpass', freq: 320, to: 120, attack: 0.15 })
    return tone(c, out, t, { freq: 82, duration: 0.35, gain: 0.11, delay: 1.6 })
  },
  'power-down': (c, out, t) => {
    noise(c, out, t, { duration: 0.5, gain: 0.04, filter: 'lowpass', freq: 800, to: 80 })
    return tone(c, out, t, { freq: 110, to: 35, duration: 1.2, gain: 0.07 })
  },
  reconnect: (c, out, t) => {
    tone(c, out, t, { freq: 220, to: 440, duration: 0.6, gain: 0.025, attack: 0.05 })
    return tone(c, out, t, { freq: 55, to: 110, duration: 1.8, gain: 0.05, attack: 0.4 })
  },

  // Interface Archaeology: the archive. Dry, close, unhurried.
  // Three strokes of a soft brush, and a little soil settling.
  brush: (c, out, t) => {
    for (let i = 0; i < 3; i++) noise(c, out, t, { duration: 0.32, gain: 0.035, filter: 'bandpass', freq: 3000, to: 1800, q: 0.8, attack: 0.08, delay: i * 0.38 })
    return noise(c, out, t, { duration: 0.8, gain: 0.03, filter: 'lowpass', freq: 380, attack: 0.1, delay: 1.1 })
  },
  // A quick run of ticks, as if something were being read, then one low note: no reading.
  decipher: (c, out, t) => {
    for (let i = 0; i < 9; i++) tone(c, out, t, { freq: 1500 + 120 * ((i * 7) % 5), duration: 0.03, gain: 0.012, delay: i * 0.09 })
    return tone(c, out, t, { freq: 196, to: 185, duration: 0.5, gain: 0.04, attack: 0.02, delay: 0.95 })
  },

  // The way out.
  'exit-door': (c, out, t) => {
    noise(c, out, t, { duration: 0.25, gain: 0.04, filter: 'lowpass', freq: 900 })
    return tone(c, out, t, { freq: 120, duration: 0.18, gain: 0.05 })
  },
} satisfies Record<string, Recipe>

export type SoundName = keyof typeof SOUNDS

const loadingBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

/** LOADING: an unresolved processing pulse, two soft ticks a second over a faint rising murmur. */
export function loadingLoop(context: BaseAudioContext) {
  const cached = loadingBuffers.get(context)
  if (cached) return cached
  const tick = (t: number) => (t >= 0 && t < 0.03 ? Math.sin(2 * Math.PI * 2400 * t) * Math.exp(-t * 160) : 0)
  const buffer = renderLoop(context, 1.2, (t) => {
    const murmur = 0.05 * Math.sin(2 * Math.PI * 180 * t) * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 1.2))
    return 0.35 * tick(t) + 0.22 * tick(t - 0.6) + murmur
  })
  loadingBuffers.set(context, buffer)
  return buffer
}
