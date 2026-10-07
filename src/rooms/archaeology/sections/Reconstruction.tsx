import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useSound } from '../../../audio/useSound'
import { DoorLeaf } from '../../../components/DoorLeaf'
import { Lectern } from '../../../components/Lectern'
import { WallText } from '../../../components/WallText'
import { motion } from '../../../museum/capabilities'
import { navigation } from '../../../museum/navigation'
import { useRoomFrame } from '../../../museum/RoomContext'
import { rect } from '../../../museum/types'
import { useObstacle } from '../../../scene/Collision'
import { useFocusTarget } from '../../../scene/Interaction'
import { Downlight, LightPool } from '../../../scene/Light'
import { createPoolMaterial, PALETTES, PLINTH_MATERIAL } from '../../../scene/materials'
import { StaticMerge } from '../../../scene/StaticMerge'
import { CatalogueCard } from '../CatalogueCard'
import { AFTERWORD, AFTERWORD_LAYOUT, cardOf, CARDS, CELLS, FINDS } from '../content'

const cell = CELLS.reconstruction
const palette = PALETTES.diorama

/*
 * IV — RECONSTRUCTION. A dark room. On a low platform, the archive's diorama of a
 * dwelling: a seat turned towards a large lit rectangle, a small one on its arm. Seen
 * from behind the seat, over its shoulder; nobody is in it. The only light in the
 * room is the rectangles' own. Then the museum's afterword, and the door back to the lobby.
 */
const STAGE = rect(-1.6, 3.4, -54.6, -48.6)
const STAGE_HEIGHT = 0.22
const BARRIER_X = STAGE.maxX + 0.25
const SEAT = { x: 1.7, z: -51.6 }
/** The cabinet the large rectangle stands on. */
const CABINET_HEIGHT = 0.5
const SCREEN_FRAME = 0.05
/** The large rectangle, standing on the cabinet: `y` is its centre. */
const SCREEN = { x: -1.15, z: -51.6, width: 1.3, height: 0.74, y: STAGE_HEIGHT + CABINET_HEIGHT + (0.74 + SCREEN_FRAME) / 2 }
const LIGHT = '#c7d2dc'

const FABRIC = new THREE.MeshStandardMaterial({ color: '#4a403a', roughness: 0.95 })
const WOOD = new THREE.MeshStandardMaterial({ color: '#2e2925', roughness: 0.6 })
const RUG = new THREE.MeshStandardMaterial({ color: '#39322d', roughness: 1 })
const SCREEN_MATERIAL = new THREE.MeshBasicMaterial({ color: LIGHT })
const PHONE_MATERIAL = new THREE.MeshBasicMaterial({ color: '#dfe6ec' })
const SCREEN_GLOW = createPoolMaterial(LIGHT, 0.16)
const SCREEN_COLOR = new THREE.Color(LIGHT)
const GLOW_COLOR = new THREE.Color(LIGHT).multiplyScalar(0.16)

/** A seat facing west: back to the visitor, arms either side. */
function Seat() {
  return (
    <group position={[SEAT.x, STAGE_HEIGHT, SEAT.z]}>
      <mesh position={[0, 0.23, 0]} material={FABRIC}>
        <boxGeometry args={[0.78, 0.26, 0.8]} />
      </mesh>
      <mesh position={[0.34, 0.6, 0]} rotation={[0, 0, -0.12]} material={FABRIC}>
        <boxGeometry args={[0.18, 0.78, 0.8]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[0.02, 0.43, side * 0.47]} material={FABRIC}>
          <boxGeometry args={[0.8, 0.26, 0.15]} />
        </mesh>
      ))}
      <mesh position={[0, 0.05, 0]} material={WOOD}>
        <boxGeometry args={[0.7, 0.1, 0.72]} />
      </mesh>
    </group>
  )
}

/**
 * The diorama: platform, rug, seat, a low cabinet and the large rectangle on it, and the
 * small rectangle on the seat's arm. The light flickers slowly, as such light does.
 */
function Diorama() {
  const elapsed = useRef(0)
  useRoomFrame((_, delta) => {
    if (motion.reduced) return
    elapsed.current += delta
    const t = elapsed.current
    const level = 0.82 + 0.1 * Math.sin(t * 0.9) + 0.06 * Math.sin(t * 2.7 + 1.3) + 0.03 * Math.sin(t * 7.1)
    SCREEN_MATERIAL.color.copy(SCREEN_COLOR).multiplyScalar(level)
    SCREEN_GLOW.color.copy(GLOW_COLOR).multiplyScalar(level)
  })

  const glow = useMemo(() => SCREEN_GLOW, [])

  return (
    <>
      <StaticMerge>
        <mesh position={[(STAGE.minX + STAGE.maxX) / 2, STAGE_HEIGHT / 2, (STAGE.minZ + STAGE.maxZ) / 2]} material={PLINTH_MATERIAL}>
          <boxGeometry args={[STAGE.maxX - STAGE.minX, STAGE_HEIGHT, STAGE.maxZ - STAGE.minZ]} />
        </mesh>
        <mesh position={[0.4, STAGE_HEIGHT + 0.004, SEAT.z]} rotation={[-Math.PI / 2, 0, 0]} material={RUG}>
          <planeGeometry args={[3.2, 2.2]} />
        </mesh>
        <Seat />
        {/* A low cabinet against the far side, and the rectangle on it. */}
        <mesh position={[SCREEN.x - 0.05, STAGE_HEIGHT + CABINET_HEIGHT / 2, SCREEN.z]} material={WOOD}>
          <boxGeometry args={[0.42, CABINET_HEIGHT, 1.7]} />
        </mesh>
        <mesh position={[SCREEN.x - 0.04, SCREEN.y, SCREEN.z]} material={WOOD}>
          <boxGeometry args={[0.06, SCREEN.height + SCREEN_FRAME, SCREEN.width + SCREEN_FRAME]} />
        </mesh>
        {/* The barrier: a low rail on two posts, at the edge of the platform. */}
        <mesh position={[BARRIER_X, 0.85, (STAGE.minZ + STAGE.maxZ) / 2]} material={WOOD}>
          <boxGeometry args={[0.04, 0.04, STAGE.maxZ - STAGE.minZ + 0.2]} />
        </mesh>
        {[STAGE.minZ, STAGE.maxZ].map((z) => (
          <mesh key={z} position={[BARRIER_X, 0.425, z]} material={WOOD}>
            <boxGeometry args={[0.05, 0.85, 0.05]} />
          </mesh>
        ))}
      </StaticMerge>

      <mesh position={[SCREEN.x - 0.005, SCREEN.y, SCREEN.z]} rotation={[0, Math.PI / 2, 0]} material={SCREEN_MATERIAL}>
        <planeGeometry args={[SCREEN.width, SCREEN.height]} />
      </mesh>
      {/* The small rectangle, face up on the arm nearest the visitor. */}
      <mesh position={[SEAT.x + 0.05, STAGE_HEIGHT + 0.565, SEAT.z + 0.47]} rotation={[-Math.PI / 2, 0, 0.3]} material={PHONE_MATERIAL}>
        <planeGeometry args={[0.075, 0.15]} />
      </mesh>

      {/* Its light on the rug, the seat and the wall behind the cabinet. */}
      <LightPool position={[0.2, STAGE_HEIGHT + 0.008, SEAT.z]} size={[3.6, 2.6]} material={glow} />
      <LightPool position={[STAGE.minX - 0.38, 1.3, SCREEN.z]} rotation={[0, Math.PI / 2, 0]} size={[3.2, 2.2]} material={glow} />
      <LightPool position={[SEAT.x - 0.38, STAGE_HEIGHT + 0.6, SEAT.z]} rotation={[0, -Math.PI / 2, 0]} size={[1.4, 1.3]} color={LIGHT} strength={0.05} />
    </>
  )
}

/** The far door: back to the lobby. */
const RETURN_X = 5.5

export function Reconstruction() {
  const play = useSound()
  const card = useMemo(() => cardOf(FINDS.shrine), [])
  useObstacle('diorama', rect(cell.minX, BARRIER_X + 0.1, STAGE.minZ - 0.2, STAGE.maxZ + 0.2))
  useFocusTarget({ id: 'shrine', position: [SEAT.x, 1, SEAT.z], distance: 4.5, facing: 0.6, card, labelled: true })

  return (
    <>
      <Diorama />
      <Lectern position={[BARRIER_X + 0.07, 0, (STAGE.minZ + STAGE.maxZ) / 2 + 1.4]} yaw={Math.PI / 2} height={1.02} tilt={-0.62} width={0.86} plate={0.5}>
        <CatalogueCard position={[0, 0, 0]} find={FINDS.shrine} width={0.86} height={0.5} />
      </Lectern>

      <WallText position={[cell.minX + 0.4, cell.minZ + 0.02]} facing="south" layout={AFTERWORD_LAYOUT} {...AFTERWORD} />
      <DoorLeaf
        id="archaeology-return"
        x={RETURN_X}
        wall={cell.minZ + 0.02}
        palette={palette}
        sign="LOBBY"
        prompt="RETURN TO THE LOBBY"
        card={CARDS.exit}
        onUse={() => {
          play('exit-door', [RETURN_X, 1.2, cell.minZ])
          navigation.returnToLobby('archaeology')
        }}
      />
      <Downlight at={[cell.minX + 2.9, cell.minZ + 1.6]} aim={[cell.minX + 2.9, 2, cell.minZ]} ceiling={cell.height} palette={palette} angle={0.55} penumbra={0.8} intensity={16} distance={6} />
    </>
  )
}
