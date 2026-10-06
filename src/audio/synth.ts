import { sound, type Vec3 } from './engine'

/*
 * Small synthesis vocabulary: a tone, a burst of filtered noise, and a positional
 * output that cleans itself up. Every sound in the museum is a few of these.
 */

const noiseBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

/** One second of white noise, generated once per context. */
export function whiteNoise(context: BaseAudioContext) {
  const cached = noiseBuffers.get(context)
  if (cached) return cached
  const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noiseBuffers.set(context, buffer)
  return buffer
}

/** A soft attack and an exponential decay: no clicks, no hard edges. */
function envelope(param: AudioParam, t: number, peak: number, attack: number, duration: number) {
  param.setValueAtTime(0.0001, t)
  param.linearRampToValueAtTime(peak, t + attack)
  param.exponentialRampToValueAtTime(0.0001, t + duration)
}

type ToneSpec = { freq: number; to?: number; duration: number; gain: number; type?: OscillatorType; attack?: number; delay?: number }

export function tone(context: AudioContext, out: AudioNode, t0: number, spec: ToneSpec) {
  const t = t0 + (spec.delay ?? 0)
  const oscillator = context.createOscillator()
  oscillator.type = spec.type ?? 'sine'
  oscillator.frequency.setValueAtTime(spec.freq, t)
  if (spec.to) oscillator.frequency.exponentialRampToValueAtTime(spec.to, t + spec.duration)
  const gain = context.createGain()
  envelope(gain.gain, t, spec.gain, spec.attack ?? 0.004, spec.duration)
  oscillator.connect(gain).connect(out)
  oscillator.start(t)
  oscillator.stop(t + spec.duration + 0.02)
  return t + spec.duration
}

type NoiseSpec = {
  duration: number
  gain: number
  filter: BiquadFilterType
  freq: number
  to?: number
  q?: number
  attack?: number
  delay?: number
}

export function noise(context: AudioContext, out: AudioNode, t0: number, spec: NoiseSpec) {
  const t = t0 + (spec.delay ?? 0)
  const source = context.createBufferSource()
  source.buffer = whiteNoise(context)
  source.loop = true
  const filter = context.createBiquadFilter()
  filter.type = spec.filter
  filter.Q.value = spec.q ?? 0.8
  filter.frequency.setValueAtTime(spec.freq, t)
  if (spec.to) filter.frequency.exponentialRampToValueAtTime(spec.to, t + spec.duration)
  const gain = context.createGain()
  envelope(gain.gain, t, spec.gain, spec.attack ?? 0.003, spec.duration)
  source.connect(filter).connect(gain).connect(out)
  source.start(t, Math.random() * 0.5)
  source.stop(t + spec.duration + 0.02)
  return t + spec.duration
}

/**
 * Where a sound comes from. With a position it is attenuated with distance (it
 * fades out within a room or two), without one it sits in the head, like UI.
 */
export function output(context: AudioContext, at?: Vec3) {
  if (!at) return context.createGain()
  const panner = context.createPanner()
  panner.panningModel = 'equalpower'
  panner.distanceModel = 'inverse'
  panner.refDistance = 1.5
  panner.rolloffFactor = 1.3
  panner.maxDistance = 40
  panner.positionX.value = at[0]
  panner.positionY.value = at[1]
  panner.positionZ.value = at[2]
  return panner
}

export type Recipe = (context: AudioContext, out: AudioNode, t: number) => number

/** Plays a recipe once, at a world position or in the head; every node is released when it ends. */
export function playRecipe(recipe: Recipe, at?: Vec3) {
  const { context, sfx } = sound
  if (!context || !sfx || context.state !== 'running') return
  const out = output(context, at)
  out.connect(sfx)
  const end = recipe(context, out, context.currentTime + 0.01)
  sound.voiceStarted()
  window.setTimeout(() => {
    out.disconnect()
    sound.voiceEnded()
  }, (end - context.currentTime + 0.25) * 1000)
}

/** A loop rendered once into a buffer, in plain JS: `fill(t)` returns the sample at time t. */
export function renderLoop(context: BaseAudioContext, seconds: number, fill: (t: number) => number) {
  const buffer = context.createBuffer(1, Math.round(seconds * context.sampleRate), context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = fill(i / context.sampleRate)
  return buffer
}

/** Starts a looping buffer at a position, fading in; returns a function that fades it out and releases it. */
export function startLoop(buffer: (context: AudioContext) => AudioBuffer, gain: number, at?: Vec3) {
  const { context, sfx } = sound
  if (!context || !sfx) return () => {}
  const source = context.createBufferSource()
  source.buffer = buffer(context)
  source.loop = true
  const level = context.createGain()
  level.gain.setValueAtTime(0, context.currentTime)
  level.gain.linearRampToValueAtTime(gain, context.currentTime + 0.8)
  const out = output(context, at)
  source.connect(level).connect(out).connect(sfx)
  source.start()
  sound.voiceStarted()
  return () => {
    const now = context.currentTime
    level.gain.cancelScheduledValues(now)
    level.gain.setValueAtTime(level.gain.value, now)
    level.gain.linearRampToValueAtTime(0, now + 0.4)
    source.stop(now + 0.45)
    source.onended = () => {
      out.disconnect()
      sound.voiceEnded()
    }
  }
}
