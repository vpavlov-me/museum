import { useMemo, useRef, useState, type ReactElement } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { useSound } from '../../../audio/useSound'
import { Text } from '../../../components/Text'
import { useRoomFrame } from '../../../museum/RoomContext'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight, LightPool, Luminaire } from '../../../scene/Light'
import { basicMaterial, floorGeometry, PALETTES, PLINTH_MATERIAL } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { Lectern } from '../../../components/Lectern'
import { CatalogueCard } from '../CatalogueCard'
import { cardOf, CELLS, FINDS, LAYERS, type Find } from '../content'
import { CellSign } from './CellSign'

const cell = CELLS.trench
const palette = PALETTES.archive

/*
 * The excavation: a pit in the middle of the hall, cut down in three steps, one per
 * layer. Walking north along its east edge is walking back in time: each step stops
 * at the foot of an older layer. The visitor stays on the floor around it, behind a rail.
 */
const PIT = rect(2.5, 9.5, -29, -19.5)
const BAND = 0.6
const STEPS = [
  { from: -19.5, to: -22.65 },
  { from: -22.65, to: -25.8 },
  { from: -25.8, to: -29 },
].map((step, i) => ({ ...step, depth: BAND * (i + 1) }))
const CURB = { width: 0.2, height: 0.1 }
const RAIL = { height: 0.95, size: 0.04, post: 0.05 }
/** Where the finds lie: near the east edge, close enough to read from the walkway. */
const FIND_X = 7.5
/** The catalogue cards stand on the east rail, facing the walkway. */
const CARD_X = PIT.maxX + CURB.width + 0.08

const soil = (color: string) => new THREE.MeshStandardMaterial({ color, roughness: 1 })
const LAYER_MATERIALS = LAYERS.map((layer) => soil(layer.color))
/** Below the oldest layer: the ground before the period. */
const BEDROCK = soil('#29221c')
/** Each step's floor is the top of the layer beneath it. */
const STEP_FLOORS = [LAYER_MATERIALS[1], LAYER_MATERIALS[2], BEDROCK]
const RAIL_MATERIAL = new THREE.MeshStandardMaterial({ color: '#34322f', roughness: 0.45, metalness: 0.3 })
const BONE = new THREE.MeshStandardMaterial({ color: '#c4bba8', roughness: 0.85 })
const DISK = new THREE.MeshStandardMaterial({ color: '#2f2e2d', roughness: 0.6 })
const STRING = basicMaterial('#6c665b')
const CHALK = '#cfc6b4'

/** The mouse pointer's outline, tip at the origin, about one unit tall. */
const ARROW_SHAPE = (() => {
  const points: [number, number][] = [
    [0, 0],
    [0, 16],
    [4, 12],
    [7, 18],
    [9, 17],
    [6, 11],
    [11, 11],
  ]
  return new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x / 18, -y / 18)))
})()
const ARROW_RELIEF = new THREE.ShapeGeometry(ARROW_SHAPE)
// Indexed, so that StaticMerge can merge it.
const ARROW_SOLID = mergeVertices(new THREE.ExtrudeGeometry(ARROW_SHAPE, { depth: 0.08, bevelEnabled: false }))

const random = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

/** Arrowheads in every layer of the west face; images of the tablet only above the layer the tablet lies in. */
const RELIEFS = (() => {
  const next = random(11)
  const arrows: { z: number; y: number; scale: number; tilt: number }[] = []
  const saves: { z: number; y: number }[] = []
  for (let i = 0; i < 34; i++) {
    const layer = Math.floor(next() * 3)
    const step = STEPS[2 - Math.floor(next() * (3 - layer))]
    const z = step.from + (step.to - step.from) * (0.08 + 0.84 * next())
    // The chalk marks start where each layer first shows: leave them clear.
    if (z > STEPS[layer].from - 2.2 && z <= STEPS[layer].from) continue
    arrows.push({ z, y: -BAND * (layer + 0.2 + 0.6 * next()), scale: 0.09 + 0.05 * next(), tilt: (next() - 0.5) * 0.5 })
  }
  for (let i = 0; i < 9; i++) {
    const z = PIT.maxZ - 2.4 - (PIT.maxZ - PIT.minZ - 2.7) * next()
    saves.push({ z, y: -BAND * (0.3 + 0.4 * next()) })
  }
  return { arrows, saves }
})()

/** The pit's walls and floors: strata on every cut face, one layer per band. */
function Excavation() {
  const faces: ReactElement[] = []
  const t = 0.1
  STEPS.forEach((step, s) => {
    const length = step.from - step.to
    const z = (step.from + step.to) / 2
    for (let band = 0; band <= s; band++) {
      const y = -BAND * (band + 0.5)
      faces.push(
        <mesh key={`w${s}${band}`} position={[PIT.minX - t / 2, y, z]} material={LAYER_MATERIALS[band]}>
          <boxGeometry args={[t, BAND, length]} />
        </mesh>,
        <mesh key={`e${s}${band}`} position={[PIT.maxX + t / 2, y, z]} material={LAYER_MATERIALS[band]}>
          <boxGeometry args={[t, BAND, length]} />
        </mesh>,
      )
    }
    // The riser down to the next step shows the next layer.
    if (s < STEPS.length - 1) {
      faces.push(
        <mesh key={`r${s}`} position={[(PIT.minX + PIT.maxX) / 2, -BAND * (s + 1.5), step.to + t / 2]} material={LAYER_MATERIALS[s + 1]}>
          <boxGeometry args={[PIT.maxX - PIT.minX, BAND, t]} />
        </mesh>,
      )
    }
    faces.push(<mesh key={`f${s}`} position={[(PIT.minX + PIT.maxX) / 2, -step.depth, z]} rotation={[-Math.PI / 2, 0, 0]} material={STEP_FLOORS[s]}><planeGeometry args={[PIT.maxX - PIT.minX, length]} /></mesh>)
  })
  // The end faces: one band at the shallow end, every band at the deep end.
  faces.push(
    <mesh key="south" position={[(PIT.minX + PIT.maxX) / 2, -BAND / 2, PIT.maxZ + t / 2]} material={LAYER_MATERIALS[0]}>
      <boxGeometry args={[PIT.maxX - PIT.minX + 2 * t, BAND, t]} />
    </mesh>,
    ...LAYER_MATERIALS.map((material, band) => (
      <mesh key={`north${band}`} position={[(PIT.minX + PIT.maxX) / 2, -BAND * (band + 0.5), PIT.minZ - t / 2]} material={material}>
        <boxGeometry args={[PIT.maxX - PIT.minX + 2 * t, BAND, t]} />
      </mesh>
    )),
  )
  return <>{faces}</>
}

/** The floor of the hall: four strips around the opening. */
function HallFloor() {
  const strips = [
    rect(cell.minX, PIT.minX, cell.minZ, cell.maxZ),
    rect(PIT.maxX, cell.maxX, cell.minZ, cell.maxZ),
    rect(PIT.minX, PIT.maxX, PIT.maxZ, cell.maxZ),
    rect(PIT.minX, PIT.maxX, cell.minZ, PIT.minZ),
  ]
  return (
    <>
      {strips.map((r) => (
        <mesh key={`${r.minX}:${r.minZ}`} position={[(r.minX + r.maxX) / 2, 0, (r.minZ + r.maxZ) / 2]} geometry={floorGeometry(r.maxX - r.minX, r.maxZ - r.minZ)} material={palette.floor} />
      ))}
    </>
  )
}

/** A low curb, a rail on posts, and the excavators' grid of strings across the opening. */
function Edge() {
  const outer = rect(PIT.minX - CURB.width, PIT.maxX + CURB.width, PIT.minZ - CURB.width, PIT.maxZ + CURB.width)
  const cx = (outer.minX + outer.maxX) / 2
  const cz = (outer.minZ + outer.maxZ) / 2
  const w = outer.maxX - outer.minX
  const l = outer.maxZ - outer.minZ
  const railY = RAIL.height
  const inset = CURB.width / 2
  const posts: [number, number][] = []
  for (let i = 0; i <= 4; i++) {
    const x = outer.minX + inset + ((w - 2 * inset) * i) / 4
    posts.push([x, outer.minZ + inset], [x, outer.maxZ - inset])
  }
  for (let i = 1; i < 5; i++) {
    const z = outer.minZ + inset + ((l - 2 * inset) * i) / 5
    posts.push([outer.minX + inset, z], [outer.maxX - inset, z])
  }

  return (
    <>
      {[
        [cx, outer.minZ + inset, w, CURB.width],
        [cx, outer.maxZ - inset, w, CURB.width],
        [outer.minX + inset, cz, CURB.width, l],
        [outer.maxX - inset, cz, CURB.width, l],
      ].map(([x, z, sx, sz]) => (
        <mesh key={`c${x}:${z}`} position={[x, CURB.height / 2, z]} material={PLINTH_MATERIAL}>
          <boxGeometry args={[sx, CURB.height, sz]} />
        </mesh>
      ))}
      {[
        [cx, outer.minZ + inset, w - 2 * inset, RAIL.size],
        [cx, outer.maxZ - inset, w - 2 * inset, RAIL.size],
        [outer.minX + inset, cz, RAIL.size, l - 2 * inset],
        [outer.maxX - inset, cz, RAIL.size, l - 2 * inset],
      ].map(([x, z, sx, sz]) => (
        <mesh key={`r${x}:${z}`} position={[x, railY, z]} material={RAIL_MATERIAL}>
          <boxGeometry args={[sx, RAIL.size, sz]} />
        </mesh>
      ))}
      {posts.map(([x, z]) => (
        <mesh key={`p${x}:${z}`} position={[x, (railY + CURB.height) / 2, z]} material={RAIL_MATERIAL}>
          <boxGeometry args={[RAIL.post, railY - CURB.height, RAIL.post]} />
        </mesh>
      ))}
      {/* The grid: one-metre squares, strung just above the floor. */}
      {Array.from({ length: Math.round(PIT.maxX - PIT.minX) - 1 }, (_, i) => (
        <mesh key={`gx${i}`} position={[PIT.minX + i + 1, 0.11, cz]} material={STRING}>
          <boxGeometry args={[0.008, 0.008, PIT.maxZ - PIT.minZ]} />
        </mesh>
      ))}
      {Array.from({ length: Math.floor(PIT.maxZ - PIT.minZ) }, (_, i) => (
        <mesh key={`gz${i}`} position={[cx, 0.11, PIT.maxZ - i - 1]} material={STRING}>
          <boxGeometry args={[PIT.maxX - PIT.minX, 0.008, 0.008]} />
        </mesh>
      ))}
    </>
  )
}

/** What is cut into the west face: arrowheads in every layer, images of the tablet in the top one. */
function Reliefs() {
  const x = PIT.minX + 0.004
  return (
    <>
      {RELIEFS.arrows.map(({ z, y, scale, tilt }, i) => (
        <mesh key={`a${i}`} position={[x, y + scale / 2, z]} rotation={[0, Math.PI / 2, tilt]} scale={scale} geometry={ARROW_RELIEF} material={BONE} />
      ))}
      {RELIEFS.saves.map(({ z, y }, i) => (
        <group key={`s${i}`} position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={BONE}>
            <planeGeometry args={[0.15, 0.15]} />
          </mesh>
          <mesh position={[0, 0.045, 0.002]} material={LAYER_MATERIALS[1]}>
            <planeGeometry args={[0.07, 0.05]} />
          </mesh>
          <mesh position={[0, -0.03, 0.002]} material={LAYER_MATERIALS[1]}>
            <planeGeometry args={[0.1, 0.06]} />
          </mesh>
        </group>
      ))}
    </>
  )
}

/* The three finds, as the archive found them: full size for a museum, not for a desk. */

function Seal() {
  return (
    <group rotation={[0, 0.12, 0]}>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[0, 0.035, i * 0.17]} material={BONE}>
          <boxGeometry args={[0.62, 0.07, 0.1]} />
        </mesh>
      ))}
    </group>
  )
}

function Tablet() {
  return (
    <group rotation={[0, -0.2, 0]}>
      <mesh position={[0, 0.02, 0]} material={DISK}>
        <boxGeometry args={[0.62, 0.04, 0.66]} />
      </mesh>
      {/* The shutter, and the label nobody wrote on. */}
      <mesh position={[0.04, 0.042, -0.21]} material={RAIL_MATERIAL}>
        <boxGeometry args={[0.3, 0.006, 0.22]} />
      </mesh>
      <mesh position={[0, 0.042, 0.12]} material={BONE}>
        <boxGeometry args={[0.48, 0.004, 0.34]} />
      </mesh>
    </group>
  )
}

function Arrowheads() {
  return (
    <>
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0.35]} scale={0.55} geometry={ARROW_SOLID} material={BONE} />
      {[
        [0.7, 0.3, 1.9],
        [-0.55, 0.45, -0.6],
        [0.35, -0.6, 2.6],
        [-0.8, -0.35, 0.9],
      ].map(([x, z, r]) => (
        <mesh key={`${x}:${z}`} position={[x, 0.004, z]} rotation={[-Math.PI / 2, 0, r]} scale={0.16} geometry={ARROW_SOLID} material={BONE} />
      ))}
    </>
  )
}

const FIND_PIECES = { seal: Seal, tablet: Tablet, arrowheads: Arrowheads }
const COVER = { width: 1.05, height: 0.2, depth: 1.05 }
const BRUSH_SECONDS = 1.8

/**
 * A find under a mound of its own layer, with a corner showing. BRUSH clears the soil
 * away; the find stays uncovered for the rest of the visit.
 */
function Dig({ find, piece, step }: { find: Find; piece: keyof typeof FIND_PIECES; step: number }) {
  const { from, to, depth } = STEPS[step]
  const z = (from + to) / 2
  const cover = useRef<THREE.Mesh>(null)
  const progress = useRef(0)
  const [brushed, setBrushed] = useState(false)
  const play = useSound()
  const card = useMemo(() => cardOf(find), [find])

  useFocusTarget({
    id: find.id,
    position: [FIND_X, -depth, z],
    distance: 3.8,
    facing: 0.55,
    card,
    labelled: true,
    prompt: brushed ? null : 'BRUSH',
    onInteract: () => {
      setBrushed(true)
      play('brush', [FIND_X, -depth + 0.2, z])
    },
  })

  useRoomFrame((_, delta) => {
    const mesh = cover.current
    if (!mesh || !brushed || progress.current >= 1) return
    progress.current = Math.min(1, progress.current + delta / BRUSH_SECONDS)
    const left = 1 - THREE.MathUtils.smoothstep(progress.current, 0, 1)
    mesh.scale.y = Math.max(0.001, left)
    mesh.position.y = (COVER.height * left) / 2 - 0.01
    mesh.visible = left > 0.002
  })

  const Piece = FIND_PIECES[piece]
  return (
    <>
      <group position={[FIND_X, -depth, z]}>
        <StaticMerge>
          <Piece />
        </StaticMerge>
        <mesh ref={cover} position={[-0.14, COVER.height / 2 - 0.01, 0.12]} material={STEP_FLOORS[step]}>
          <boxGeometry args={[COVER.width, COVER.height, COVER.depth]} />
        </mesh>
      </group>
      {/* The card stands on a lectern by the rail, just before the find, so that it never hides it. */}
      <Lectern position={[CARD_X, 0, z + 1.15]} yaw={Math.PI / 2} height={RAIL.height + 0.2} tilt={-0.75} width={0.82} plate={0.48}>
        <CatalogueCard position={[0, 0, 0]} find={find} width={0.82} height={0.48} />
      </Lectern>
      <Downlight at={[FIND_X + 1.4, z]} aim={[FIND_X, -depth, z]} ceiling={cell.height} palette={palette} angle={0.26} penumbra={0.75} intensity={95} distance={11} />
    </>
  )
}

/**
 * II — THE TRENCH. A tall hall around an excavation. The finds lie in their layers
 * under soil, with the archive's cards on the rail above them; the faces of the cut
 * show the layers, and what each layer holds.
 */
export function Trench() {
  useObstacle('pit', rect(PIT.minX - CURB.width - 0.05, PIT.maxX + CURB.width + 0.12, PIT.minZ - CURB.width - 0.05, PIT.maxZ + CURB.width + 0.05))

  return (
    <>
      <StaticMerge>
        <HallFloor />
        <Excavation />
        <Edge />
        <Reliefs />
        {/* Two long slots over the walkways: the hall's light, kept off the pit. */}
        {[cell.minX + 1.6, cell.maxX - 1.6].map((x) => (
          <Luminaire key={x} position={[x, cell.height - 0.004, (cell.minZ + cell.maxZ) / 2]} size={[0.14, cell.maxZ - cell.minZ - 2.4]} palette={palette} />
        ))}
      </StaticMerge>

      <LightPool position={[cell.maxX - 2.2, 0.004, (cell.minZ + cell.maxZ) / 2]} size={[4.5, 17]} color="#efe6d6" strength={0.05} />
      <LightPool position={[cell.minX + 2.2, 0.004, (cell.minZ + cell.maxZ) / 2]} size={[4.5, 17]} color="#efe6d6" strength={0.05} />

      {/* Layer marks on the west face, in the excavators' chalk, each where its layer first shows. */}
      {LAYERS.map((layer, band) => (
        <Text
          key={layer.numeral}
          position={[PIT.minX + 0.006, -BAND * (band + 0.5), STEPS[band].from - 0.25]}
          rotation={[0, Math.PI / 2, 0]}
          fontSize={0.11}
          letterSpacing={0.08}
          color={CHALK}
          anchorX="left"
          anchorY="middle"
        >
          {`${layer.numeral}   ${layer.dates}`}
        </Text>
      ))}

      <Dig find={FINDS.seal} piece="seal" step={0} />
      <Dig find={FINDS.tablet} piece="tablet" step={1} />
      <Dig find={FINDS.arrowheads} piece="arrowheads" step={2} />

      <CellSign position={[cell.maxX - 3.4, 3.1, cell.minZ + 0.02]} kicker="02 / II" name="THE TRENCH" />
    </>
  )
}
