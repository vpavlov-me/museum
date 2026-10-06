import { sound } from './engine'
import { renderLoop, whiteNoise } from './synth'

/*
 * Room tone: what a quiet building sounds like. A loop of brown noise through a
 * low-pass filter (the air handling), a faint electrical hum, a hum slightly out of
 * tune with it (only where something is wrong), and a little high "air". Each space
 * has its own mix; moving between spaces glides between them, so no door clicks.
 */

type Profile = {
  /** Level of the low rumble. */
  noise: number
  /** Its cutoff, Hz: lower is further away and heavier. */
  lowpass: number
  hum: number
  /** A second hum 3 Hz off the first: a slow beat, unsettled. */
  beat: number
  /** High, airy hiss: open, clean spaces. */
  air: number
}

const profile = (noise: number, lowpass: number, hum: number, air: number, beat = 0): Profile => ({ noise, lowpass, hum, beat, air })

const PROFILES: Record<string, Profile> = {
  // The lobby: open, bright and slightly busier, a public space.
  lobby: profile(0.055, 360, 0.002, 0.005),
  entrance: profile(0.05, 320, 0.002, 0.004),
  'the-button': profile(0.045, 260, 0.003, 0.003),
  passage: profile(0.03, 170, 0.001, 0),
  // Harsher light, harsher air: the fluorescent hum is most present here.
  accepted: profile(0.05, 420, 0.007, 0.004),
  'transition-03': profile(0.025, 150, 0, 0),
  states: profile(0.04, 280, 0.002, 0.003),
  'states:loading': profile(0.04, 300, 0.003, 0.002),
  // Near silence: the emptiness is the exhibit.
  'states:empty': profile(0.012, 200, 0, 0.001),
  'states:error': profile(0.045, 260, 0.004, 0.002, 0.004),
  'states:offline': profile(0.04, 280, 0.003, 0.002),
  // The system behind the room has gone: the air handling stops, only the building remains.
  'states:offline-dark': profile(0.014, 110, 0, 0),
  // Release: quieter, but brighter and cleaner, without hum.
  'states:success': profile(0.028, 900, 0, 0.006),
  'archaeology-passage': profile(0.025, 150, 0, 0),
  // The archive: dry and still, the air handling of a building kept for storage.
  archaeology: profile(0.035, 230, 0.001, 0.002),
  // The hall over the excavation: taller, so a little more air and less hum.
  'archaeology:trench': profile(0.04, 200, 0, 0.004),
  'archaeology:store': profile(0.03, 260, 0.002, 0.001),
  // Dark, and the faint whine of the lit rectangle: the only thing in the room that is on.
  'archaeology:reconstruction': profile(0.018, 180, 0.004, 0.001),
  colophon: profile(0.03, 300, 0, 0.002),
}

const DEFAULT = PROFILES.states
const GLIDE = 0.7

/** A space id, or `space:zone`, falling back to the space. */
const resolve = (key: string) => PROFILES[key] ?? PROFILES[key.split(':')[0]] ?? DEFAULT

type Nodes = { noise: GainNode; filter: BiquadFilterNode; hum: GainNode; beat: GainNode; air: GainNode }
let nodes: Nodes | null = null
let place = 'entrance'
/** States that change a place's sound while they last: OFFLINE swaps in its power cut. */
const variants = new Map<string, string>()
const effective = () => variants.get(place) ?? place

const brownBuffers = new WeakMap<BaseAudioContext, AudioBuffer>()

/** Eight seconds of brown noise whose end is crossfaded into its start, so it loops without a seam. */
function brownNoise(context: BaseAudioContext) {
  const cached = brownBuffers.get(context)
  if (cached) return cached
  const seconds = 8
  const fade = 0.5
  const raw = new Float32Array(Math.round((seconds + fade) * context.sampleRate))
  let last = 0
  let peak = 0
  for (let i = 0; i < raw.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02
    raw[i] = last
    peak = Math.max(peak, Math.abs(last))
  }
  const fadeSamples = Math.round(fade * context.sampleRate)
  const length = raw.length - fadeSamples
  const buffer = renderLoop(context, length / context.sampleRate, (t) => {
    const i = Math.round(t * context.sampleRate)
    const mix = i < fadeSamples ? i / fadeSamples : 1
    const tail = i < fadeSamples ? raw[length + i] : 0
    return ((raw[i] * mix + tail * (1 - mix)) / peak) * 0.6
  })
  brownBuffers.set(context, buffer)
  return buffer
}

function build(context: AudioContext) {
  const bus = sound.ambience
  if (!bus) return
  const gain = (value: number) => {
    const node = context.createGain()
    node.gain.value = value
    node.connect(bus)
    return node
  }
  const start = resolve(effective())

  const rumble = context.createBufferSource()
  rumble.buffer = brownNoise(context)
  rumble.loop = true
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = start.lowpass
  const noiseGain = gain(start.noise)
  rumble.connect(filter).connect(noiseGain)
  rumble.start()

  const humGain = gain(start.hum)
  const beatGain = gain(start.beat)
  for (const [frequency, out] of [
    [100, humGain],
    [200, humGain],
    [103, beatGain],
  ] as const) {
    const oscillator = context.createOscillator()
    oscillator.frequency.value = frequency
    oscillator.connect(out)
    oscillator.start()
  }

  const air = context.createBufferSource()
  air.buffer = whiteNoise(context)
  air.loop = true
  const airFilter = context.createBiquadFilter()
  airFilter.type = 'bandpass'
  airFilter.frequency.value = 3200
  airFilter.Q.value = 0.5
  const airGain = gain(start.air)
  air.connect(airFilter).connect(airGain)
  air.start()

  nodes = { noise: noiseGain, filter, hum: humGain, beat: beatGain, air: airGain }
}

sound.onUnlock(build)

function apply() {
  const target = resolve(effective())
  const context = sound.context
  if (!nodes || !context) return
  const t = context.currentTime
  nodes.noise.gain.setTargetAtTime(target.noise, t, GLIDE)
  nodes.filter.frequency.setTargetAtTime(target.lowpass, t, GLIDE)
  nodes.hum.gain.setTargetAtTime(target.hum, t, GLIDE)
  nodes.beat.gain.setTargetAtTime(target.beat, t, GLIDE)
  nodes.air.gain.setTargetAtTime(target.air, t, GLIDE)
}

export const ambience = {
  /** Where the visitor is: glides the room tone to that space's mix. */
  setPlace(key: string) {
    if (key === place) return
    place = key
    apply()
  },
  /** While a state lasts, `place` sounds like `variant` instead (pass null to end it). */
  setVariant(place: string, variant: string | null) {
    if (variant) variants.set(place, variant)
    else variants.delete(place)
    apply()
  },
}
