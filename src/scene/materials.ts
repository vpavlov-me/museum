import * as THREE from 'three'

/*
 * Shared materials. Every architectural surface in a space uses one of a handful
 * of instances, so static architecture can be merged per material (StaticMerge)
 * and the renderer compiles only a few programs. No external textures: stone, marble
 * and plaster are generated once from a small procedural noise.
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

const NOISE_SIZE = 128
const noise = tileableNoise(NOISE_SIZE)

/** A tiling, mipmapped texture from RGBA bytes. */
function toTexture(data: Uint8Array, size: number) {
  const texture = new THREE.DataTexture(data, size, size)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.generateMipmaps = true
  texture.anisotropy = 8
  texture.needsUpdate = true
  return texture
}

/** A greyscale texture from per-pixel values in [0, 1]. */
function dataTexture(size: number, value: (x: number, y: number) => number) {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const c = Math.round(Math.min(1, Math.max(0, value(x, y))) * 255)
      const i = (y * size + x) * 4
      data[i] = data[i + 1] = data[i + 2] = c
      data[i + 3] = 255
    }
  }
  return toTexture(data, size)
}

/** The tileable noise, sampled at any resolution (bilinear), in [0, 1]. */
function sampleNoise(x: number, y: number, size: number) {
  const gx = ((x / size) * NOISE_SIZE + NOISE_SIZE) % NOISE_SIZE
  const gy = ((y / size) * NOISE_SIZE + NOISE_SIZE) % NOISE_SIZE
  const x0 = Math.floor(gx)
  const y0 = Math.floor(gy)
  const fx = gx - x0
  const fy = gy - y0
  const at = (i: number, j: number) => noise[(j % NOISE_SIZE) * NOISE_SIZE + (i % NOISE_SIZE)]
  const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx
  const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx
  return top + (bottom - top) * fy
}

/*
 * Stone, generated once. One repeat covers STONE_REPEAT metres of floor: tiles laid in a
 * running bond (or square slabs, for marble), each with its own tone, a fine mottle and
 * thin joints. The colour map multiplies the palette's floor colour, so every room keeps
 * its temperature; the roughness map keeps joints matte and tiles polished.
 */
const STONE_SIZE = 512
/** Metres covered by one repeat of a floor texture. */
const STONE_REPEAT = 4
const JOINT = 1.6 / STONE_SIZE

type Tiling = { columns: number; rows: number; bond: boolean }

/** Where a texel falls: its tile, its position in the tile, and how close it is to a joint (0 on the joint). */
function tileAt(u: number, v: number, { columns, rows, bond }: Tiling) {
  const row = Math.floor(v * rows)
  const shifted = bond && row % 2 === 1 ? u + 0.5 / columns : u
  const column = Math.floor((((shifted % 1) + 1) % 1) * columns)
  const lu = ((((shifted % 1) + 1) % 1) * columns) % 1
  const lv = (v * rows) % 1
  const edge = Math.min(lu / columns, (1 - lu) / columns, lv / rows, (1 - lv) / rows)
  return { id: row * 97 + column * 13 + 7, lu, lv, edge }
}

const tileTone = (id: number) => mulberry32(id)()

/**
 * Stone maps: colour (a multiplier of the palette's floor colour) and roughness, filled
 * in one pass. They start as a plain, even stone and are drawn in small slices while the
 * page is idle (the entrance screen is up for far longer), so generating them never
 * holds up the first frame. Their size never changes, so nothing recompiles.
 */
function stoneMaps(tiling: Tiling, veined: boolean) {
  const color = new Uint8Array(STONE_SIZE * STONE_SIZE * 4).fill(Math.round(0.94 * 255))
  const roughness = new Uint8Array(STONE_SIZE * STONE_SIZE * 4).fill(Math.round(0.75 * 255))
  const maps = { color: toTexture(color, STONE_SIZE), roughness: toTexture(roughness, STONE_SIZE) }
  const veins = new Map<number, { cos: number; sin: number; phase: number }>()

  const rows = (from: number, to: number) => {
    for (let y = from; y < to; y++) {
      for (let x = 0; x < STONE_SIZE; x++) {
        const tile = tileAt(x / STONE_SIZE, y / STONE_SIZE, tiling)
        const joint = tile.edge < JOINT ? 1 : tile.edge < JOINT * 2 ? 0.4 : 0
        const mottle = sampleNoise(x * 2, y * 2, STONE_SIZE)
        const tone = tileTone(tile.id)
        let vein = 0
        if (veined) {
          // Marble: veins along a direction of their own on each slab, bent by the noise.
          let v = veins.get(tile.id)
          if (!v) {
            const random = mulberry32(tile.id)
            const angle = random() * Math.PI
            v = { cos: Math.cos(angle), sin: Math.sin(angle), phase: random() * 10 }
            veins.set(tile.id, v)
          }
          const along = tile.lu * v.cos + tile.lv * v.sin
          const bend = sampleNoise(x, y, STONE_SIZE) * 5 + mottle * 1.4
          const wave = Math.abs(Math.sin((along * 3.2 + bend + v.phase) * Math.PI))
          vein = Math.pow(1 - wave, 18) * 0.55 + Math.pow(1 - wave, 5) * 0.12
        }
        const base = veined ? 0.94 + tone * 0.06 : 0.9 + tone * 0.1
        const c = (base + (mottle - 0.5) * (veined ? 0.05 : 0.08) - vein) * (1 - joint * (veined ? 0.3 : 0.18))
        const r = 0.6 + mottle * 0.3 + joint * 0.4
        const i = (y * STONE_SIZE + x) * 4
        const cb = Math.round(Math.min(1, Math.max(0, c)) * 255)
        const rb = Math.round(Math.min(1, Math.max(0, r)) * 255)
        color[i] = color[i + 1] = color[i + 2] = cb
        roughness[i] = roughness[i + 1] = roughness[i + 2] = rb
        color[i + 3] = roughness[i + 3] = 255
      }
    }
  }

  let next = 0
  const slice = () => {
    const end = Math.min(STONE_SIZE, next + 32)
    rows(next, end)
    next = end
    if (next < STONE_SIZE) return later(slice)
    maps.color.needsUpdate = true
    maps.roughness.needsUpdate = true
  }
  later(slice)
  return maps
}

/** Runs `task` when the page is idle (or soon, where idle callbacks are missing). */
const later = (task: () => void) => {
  if (typeof window === 'undefined') return task()
  if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: 500 })
  else setTimeout(task, 0)
}

/** Large tiles in a running bond: the exhibition rooms' dark stone. */
const STONE = stoneMaps({ columns: 2, rows: 4, bond: true }, false)
/** Square slabs with veins: the lobby's marble. */
const MARBLE = stoneMaps({ columns: 2, rows: 2, bond: false }, true)

/** Metres covered by one repeat of the plaster texture. */
const PLASTER_REPEAT = 2.5
/** Plaster: a faint, broad unevenness in tone and sheen, never a pattern. */
const PLASTER = dataTexture(128, (x, y) => 0.94 + (sampleNoise(x, y, 128) - 0.5) * 0.08 + (sampleNoise(x * 4, y * 4, 128) - 0.5) * 0.03)

/**
 * Maps a material's textures by world position, not by each mesh's own UVs: floors
 * by x and z, walls by their run and height. Neighbouring floors and walls then
 * continue one another's tiles and plaster without seams, at one texel density, and
 * geometry needs no UVs of its own. All such materials share one program.
 */
function worldMapped<T extends THREE.MeshStandardMaterial>(material: T, repeat: number) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.worldRepeat = { value: repeat }
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nuniform float worldRepeat;').replace(
      '#include <uv_vertex>',
      `#include <uv_vertex>
      #ifdef USE_MAP
      {
        vec4 localAt = vec4( position, 1.0 );
        vec3 localNormal = normal;
        #ifdef USE_INSTANCING
        localAt = instanceMatrix * localAt;
        localNormal = mat3( instanceMatrix ) * localNormal;
        #endif
        vec4 worldAt = modelMatrix * localAt;
        vec3 worldNormal = normalize( mat3( modelMatrix ) * localNormal );
        vec2 worldUv = abs( worldNormal.y ) > 0.5 ? worldAt.xz : ( abs( worldNormal.x ) > abs( worldNormal.z ) ? worldAt.zy : worldAt.xy );
        vMapUv = worldUv / worldRepeat;
        #ifdef USE_ROUGHNESSMAP
        vRoughnessMapUv = vMapUv;
        #endif
      }
      #endif`,
    )
  }
  material.customProgramCacheKey = () => 'world-mapped'
  return material
}

/*
 * Reflections are kept to the surfaces that show them: stone floors, skirting, trim,
 * plinths and fixtures. Walls, ceilings and exhibits do not sample the environment at
 * all, which keeps every other fragment as cheap as before.
 */
const reflective = new Set<THREE.MeshStandardMaterial>()
let environment: THREE.Texture | null = null

/** Marks a material as reflecting the museum's environment (see scene/Lighting). */
export function reflects<T extends THREE.MeshStandardMaterial>(material: T): T {
  reflective.add(material)
  if (environment) material.envMap = environment
  return material
}

/** Hands the generated environment to every reflective material, present and future. */
export function setEnvironment(texture: THREE.Texture | null) {
  environment = texture
  for (const material of reflective) {
    material.envMap = texture
    material.needsUpdate = true
  }
}

/** Kept for floors laid outside RoomShell: plain planes, mapped by world position like every floor. */
const floors = new Map<string, THREE.PlaneGeometry>()

export function floorGeometry(width: number, length: number) {
  const key = `${width}:${length}`
  const cached = floors.get(key)
  if (cached) return cached
  const geometry = new THREE.PlaneGeometry(width, length)
  geometry.rotateX(-Math.PI / 2)
  floors.set(key, geometry)
  return geometry
}

export type Palette = {
  wall: THREE.MeshStandardMaterial
  floor: THREE.MeshStandardMaterial
  ceiling: THREE.MeshStandardMaterial
  /** The skirting board at the foot of walls, and the shadow gap under the ceiling. */
  skirting: THREE.MeshStandardMaterial
  /** Door jambs and heads. */
  reveal: THREE.MeshStandardMaterial
  /** Architraves around openings: the room's trim. */
  trim: THREE.MeshStandardMaterial
  threshold: THREE.MeshBasicMaterial
  /** Luminous ceiling slots and panels. */
  glow: THREE.MeshBasicMaterial
}

export type PaletteColors = {
  wall: string
  floor: string
  ceiling: string
  glow: string
  floorRoughness?: number
  /** Architraves and skirting; by default a dark stone. */
  trim?: string
  /** `marble` for light, veined slabs (the lobby); `stone` (default) for dark tiles. */
  floorKind?: 'stone' | 'marble'
}

/** A new set of palette materials. Use the shared PALETTES unless a space needs to animate its own. */
export function createPalette(colors: PaletteColors): Palette {
  const stone = colors.floorKind === 'marble' ? MARBLE : STONE
  const trim = colors.trim ?? '#1f1d1b'
  // Light stone trim keeps a trace of its own light, like the ceilings, so the undersides of beams and cornices stay stone, not shadow.
  const trimGlow = colors.floorKind === 'marble' ? 0.32 : 0
  return {
    wall: worldMapped(new THREE.MeshStandardMaterial({ color: colors.wall, roughness: 0.92, map: PLASTER }), PLASTER_REPEAT),
    floor: reflects(worldMapped(
      new THREE.MeshStandardMaterial({
        color: colors.floor,
        roughness: colors.floorRoughness ?? 0.5,
        map: stone.color,
        roughnessMap: stone.roughness,
        // Dark stone shows the room's light, not a grey sky; light marble takes more of it.
        envMapIntensity: colors.floorKind === 'marble' ? 0.8 : 0.6,
      }),
      STONE_REPEAT,
    )),
    // Ceilings face away from the sky light; a trace of self-illumination keeps them a surface, not a void.
    ceiling: new THREE.MeshStandardMaterial({ color: colors.ceiling, roughness: 1, emissive: colors.ceiling, emissiveIntensity: 0.9 }),
    skirting: reflects(new THREE.MeshStandardMaterial({ color: trim, roughness: 0.42, envMapIntensity: 1.2 })),
    reveal: new THREE.MeshStandardMaterial({ color: '#1c1b1a', roughness: 0.8 }),
    trim: reflects(new THREE.MeshStandardMaterial({ color: trim, roughness: 0.42, envMapIntensity: 1.2, emissive: trim, emissiveIntensity: trimGlow })),
    threshold: new THREE.MeshBasicMaterial({ color: '#141413' }),
    glow: new THREE.MeshBasicMaterial({ color: colors.glow }),
  }
}

/** Room 03's base: a plain, neutral grey between the gallery and Room 02. */
export const STATES_COLORS: PaletteColors = { wall: '#53514d', floor: '#292826', ceiling: '#2e2c2a', glow: '#e4e0d6', floorRoughness: 0.58 }

/** One palette per kind of space: the same museum, different temperatures. */
export const PALETTES = {
  // The lobby: a classical hall in light, veined marble, pale walls and light stone trim.
  lobby: createPalette({ wall: '#d6d0c4', floor: '#b3ac9f', ceiling: '#d8d1c4', glow: '#fbf6ec', floorRoughness: 0.42, floorKind: 'marble', trim: '#e9e4da' }),
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
  // Interface Archaeology, an archive: the gallery grey, a little warmer and drier, like a store kept for a long time.
  archive: createPalette({ wall: '#514b44', floor: '#2b2825', ceiling: '#2e2b27', glow: '#e9dfcd', floorRoughness: 0.64 }),
  // Dark Patterns: a cool, shop-bright grey, under fluorescent light.
  sales: createPalette({ wall: '#5c5e62', floor: '#2b2c2f', ceiling: '#2f3033', glow: '#eef2f5', floorRoughness: 0.5 }),
  // The cancellation flow: the same shop, with the lights turned down.
  flow: createPalette({ wall: '#3c3d40', floor: '#202123', ceiling: '#242527', glow: '#b9bec4' }),
  // The reconstruction: a dark room, so that the only light in it is the diorama's.
  diorama: createPalette({ wall: '#2b2927', floor: '#1c1b19', ceiling: '#201f1d', glow: '#8f887c' }),
} satisfies Record<string, Palette>

/** Dark satin lacquer: plinths answer the downlights with a soft highlight the walls do not have. */
export const PLINTH_MATERIAL = reflects(new THREE.MeshStandardMaterial({ color: '#1c1b1a', roughness: 0.38 }))

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
