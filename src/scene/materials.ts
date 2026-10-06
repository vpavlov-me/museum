import * as THREE from 'three'

/*
 * Shared materials. Every architectural surface in a space uses one of a handful
 * of instances, so static architecture can be merged per material (StaticMerge)
 * and the renderer compiles only a few programs. No external textures: the only
 * maps are a small procedural noise, generated once.
 */

const mulberry32 = (seed: number) => () => {
  seed |= 0
  seed = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** Tileable value noise in [0, 1], a few octaves. */
function tileableNoise(size: number) {
  const random = mulberry32(7)
  const octave = (cells: number) => {
    const grid = Float32Array.from({ length: cells * cells }, random)
    return (x: number, y: number) => {
      const gx = (x / size) * cells
      const gy = (y / size) * cells
      const x0 = Math.floor(gx)
      const y0 = Math.floor(gy)
      const fx = gx - x0
      const fy = gy - y0
      const sx = fx * fx * (3 - 2 * fx)
      const sy = fy * fy * (3 - 2 * fy)
      const at = (i: number, j: number) => grid[((j + cells) % cells) * cells + ((i + cells) % cells)]
      const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx
      const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx
      return top + (bottom - top) * sy
    }
  }
  const octaves: [ReturnType<typeof octave>, number][] = [
    [octave(4), 0.45],
    [octave(16), 0.35],
    [octave(64), 0.2],
  ]
  const values = new Float32Array(size * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      values[y * size + x] = octaves.reduce((sum, [sample, weight]) => sum + sample(x, y) * weight, 0)
    }
  }
  return values
}

function noiseTexture(values: Float32Array, size: number, low: number, high: number) {
  const data = new Uint8Array(size * size * 4)
  values.forEach((v, i) => {
    const c = Math.round((low + (high - low) * v) * 255)
    data.set([c, c, c, 255], i * 4)
  })
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

const NOISE_SIZE = 128
const noise = tileableNoise(NOISE_SIZE)
// Floors: a faint mottle in colour and a wider swing in roughness, like sealed concrete.
const floorTint = noiseTexture(noise, NOISE_SIZE, 0.86, 1)
const floorRoughness = noiseTexture(noise, NOISE_SIZE, 0.7, 1)

/** Metres covered by one repeat of the floor texture. */
const FLOOR_TILE = 3

const floors = new Map<string, THREE.PlaneGeometry>()

/** Horizontal floor plane with UVs in world scale, so every floor shares one material at one texel density. */
export function floorGeometry(width: number, length: number) {
  const key = `${width}:${length}`
  const cached = floors.get(key)
  if (cached) return cached
  const geometry = new THREE.PlaneGeometry(width, length)
  const uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * width) / FLOOR_TILE, (uv.getY(i) * length) / FLOOR_TILE)
  geometry.rotateX(-Math.PI / 2)
  floors.set(key, geometry)
  return geometry
}

export type Palette = {
  wall: THREE.MeshStandardMaterial
  floor: THREE.MeshStandardMaterial
  ceiling: THREE.MeshStandardMaterial
  /** Recessed skirting at the foot of walls: reads as a shadow line. */
  skirting: THREE.MeshStandardMaterial
  /** Door jambs and heads. */
  reveal: THREE.MeshStandardMaterial
  threshold: THREE.MeshBasicMaterial
  /** Luminous ceiling slots and panels. */
  glow: THREE.MeshBasicMaterial
}

export type PaletteColors = { wall: string; floor: string; ceiling: string; glow: string; floorRoughness?: number }

/** A new set of palette materials. Use the shared PALETTES unless a space needs to animate its own. */
export function createPalette(colors: PaletteColors): Palette {
  return {
    wall: new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.94 }),
    floor: new THREE.MeshStandardMaterial({
      color: colors.floor,
      roughness: colors.floorRoughness ?? 0.62,
      map: floorTint,
      roughnessMap: floorRoughness,
    }),
    // Ceilings face away from the sky light; a trace of self-illumination keeps them a surface, not a void.
    ceiling: new THREE.MeshStandardMaterial({ color: colors.ceiling, roughness: 1, emissive: colors.ceiling, emissiveIntensity: 0.9 }),
    skirting: new THREE.MeshStandardMaterial({ color: '#151514', roughness: 0.7 }),
    reveal: new THREE.MeshStandardMaterial({ color: '#1c1b1a', roughness: 0.8 }),
    threshold: new THREE.MeshBasicMaterial({ color: '#141413' }),
    glow: new THREE.MeshBasicMaterial({ color: colors.glow }),
  }
}

/** Room 03's base: a plain, neutral grey between the gallery and Room 02. */
export const STATES_COLORS: PaletteColors = { wall: '#53514d', floor: '#292826', ceiling: '#2e2c2a', glow: '#e4e0d6', floorRoughness: 0.58 }

/** One palette per kind of space: the same museum, different temperatures. */
export const PALETTES = {
  // Lightest: warm, welcoming, establishes scale.
  entrance: createPalette({ wall: '#77736c', floor: '#45423e', ceiling: '#47443f', glow: '#bdb6a8' }),
  // Neutral gallery: calm grey walls, a satin floor that catches the downlights.
  gallery: createPalette({ wall: '#5c5954', floor: '#2f2d2b', ceiling: '#36332f', glow: '#e8e1d2', floorRoughness: 0.55 }),
  // Darker, lower, quieter.
  passage: createPalette({ wall: '#2e2d2b', floor: '#1d1c1b', ceiling: '#222120', glow: '#9a9488' }),
  // Cooler and harder: the same grey, slightly green, under harsher light.
  accepted: createPalette({ wall: '#454742', floor: '#262726', ceiling: '#272927', glow: '#d6dfe0', floorRoughness: 0.5 }),
  // Room 03: one plain grey, which each state then bends.
  states: createPalette(STATES_COLORS),
  // Paler and quieter: a large room with nothing to look at.
  empty: createPalette({ wall: '#6c6a64', floor: '#3b3a37', ceiling: '#3d3b38', glow: '#dcd8cf', floorRoughness: 0.66 }),
  // The brightest space in the museum.
  success: createPalette({ wall: '#a9a59c', floor: '#68655f', ceiling: '#bfbaaf', glow: '#fbf8f0', floorRoughness: 0.5 }),
  // Room 04, an archive: the gallery grey, a little warmer and drier, like a store kept for a long time.
  archive: createPalette({ wall: '#514b44', floor: '#2b2825', ceiling: '#2e2b27', glow: '#e9dfcd', floorRoughness: 0.64 }),
  // The reconstruction: a dark room, so that the only light in it is the diorama's.
  diorama: createPalette({ wall: '#2b2927', floor: '#1c1b19', ceiling: '#201f1d', glow: '#8f887c' }),
} satisfies Record<string, Palette>

/** Dark satin lacquer: plinths answer the downlights with a soft highlight the walls do not have. */
export const PLINTH_MATERIAL = new THREE.MeshStandardMaterial({ color: '#1c1b1a', roughness: 0.38 })

const basics = new Map<string, THREE.MeshBasicMaterial>()

/** Shared unlit material by colour, for interface surfaces that should ignore the room's light. */
export function basicMaterial(color: string) {
  const cached = basics.get(color)
  if (cached) return cached
  const material = new THREE.MeshBasicMaterial({ color })
  basics.set(color, material)
  return material
}

function radialGlow() {
  const size = 64
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.min(1, Math.hypot(x + 0.5 - size / 2, y + 0.5 - size / 2) / (size / 2))
      const v = Math.round(255 * Math.pow(1 - d * d, 2.2))
      data.set([v, v, v, 255], (y * size + x) * 4)
    }
  }
  const texture = new THREE.DataTexture(data, size, size)
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

const GLOW = radialGlow()
const pools = new Map<string, THREE.MeshBasicMaterial>()

/** A pool material of its own, whose colour (and so strength) can be animated. */
export function createPoolMaterial(color: string, strength: number) {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color).multiplyScalar(strength),
    map: GLOW,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}

/** Additive radial falloff: a light pool painted on a surface, without a realtime light. Shared by colour and strength. */
export function poolMaterial(color: string, strength: number) {
  const key = `${color}:${strength}`
  const cached = pools.get(key)
  if (cached) return cached
  const material = createPoolMaterial(color, strength)
  pools.set(key, material)
  return material
}
