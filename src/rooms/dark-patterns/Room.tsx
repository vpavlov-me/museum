import { useRef, useState } from 'react'
import { useSound } from '../../audio/useSound'
import { DoorLeaf } from '../../components/DoorLeaf'
import { RoomShell } from '../../components/RoomShell'
import { ExhibitionPlan } from '../../components/ExhibitionPlan'
import { Text } from '../../components/Text'
import { WallMount } from '../../components/WallMount'
import { TurnPassage } from '../../components/TurnPassage'
import { Wall } from '../../components/Wall'
import { WallText } from '../../components/WallText'
import { navigation } from '../../museum/navigation'
import { DARK_PASSAGE, DOORS, localDoor, WALL_THICKNESS } from '../../museum/roomRegistry'
import { RoomContents, useRoom, useRoomFrame } from '../../museum/RoomContext'
import { box } from '../../museum/types'
import { useObstacle } from '../../scene/Collision'
import { roundedRect } from '../../scene/geometry'
import { useFocusTarget } from '../../scene/Interaction'
import { LightPool, Luminaire } from '../../scene/Light'
import { basicMaterial, PALETTES, PLINTH_MATERIAL } from '../../scene/materials'
import { StaticMerge } from '../../scene/StaticMerge'
import { displayCase, TYPE } from '../../identity'
import { AFTERWORD, AFTERWORD_LAYOUT, CARDS, CELLS, CONFIRMSHAMING, FLOW, INK, PATTERNS, RECEIPT, SALES, THESIS, THESIS_LAYOUT, TITLE, TOTAL } from './content'
import { PatternLabel, Screen } from './shared'

const { welcome, checkout, stay, flow1, flow2, flow3, flow4, cancelled } = CELLS
const sales = PALETTES.sales
const flow = PALETTES.flow
const t = WALL_THICKNESS
const euros = (value: number) => `€${value.toFixed(2)}`

/** The passage off the lobby: the same low turn as before every exhibition, mirrored. */
export function DarkPassage() {
  return <TurnPassage plan={DARK_PASSAGE} entry="darkEntry" kicker="TEMPORARY EXHIBITION" number="03" title={'DARK\nPATTERNS'} turn="west" />
}

/* I — WELCOME. The title and thesis ahead; on the right, a countdown and a crowd. */

const COUNTDOWN = 59

function Welcome() {
  const { origin } = useRoom()
  const [left, setLeft] = useState(COUNTDOWN)
  const [watching, setWatching] = useState(14)
  const elapsed = useRef(0)
  const lastSecond = useRef(0)

  useRoomFrame((_, delta) => {
    elapsed.current += delta
    const second = Math.floor(elapsed.current)
    if (second === lastSecond.current) return
    lastSecond.current = second
    // Runs out, and starts again: a deadline that is never reached.
    setLeft(COUNTDOWN - (second % (COUNTDOWN + 1)))
    if (second % 3 === 0) setWatching((n) => Math.max(9, Math.min(19, n + Math.round(Math.random() * 4 - 2))))
  })

  const wall = welcome.minZ + 0.02
  const east = welcome.maxX - 0.02
  const time = `00:${String(left).padStart(2, '0')}`

  return (
    <>
      <StaticMerge>
        <Luminaire position={[(welcome.minX + welcome.maxX) / 2, welcome.height - 0.004, welcome.minZ + 1.4]} size={[7.4, 0.12]} palette={sales} />
      </StaticMerge>
      <LightPool position={[-8.6, 2.4, wall - 0.008]} rotation={[0, 0, 0]} size={[7.5, 4]} color="#eef2f5" strength={0.07} />

      <group position={[welcome.minX + 0.4, 0, wall]}>
        <Text position={[0, 3.95, 0]} fontSize={TYPE.kicker} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
          {TITLE.kicker}
        </Text>
        <Text face="display" position={[0, 3.76, 0]} fontSize={0.5} letterSpacing={-0.005} color={INK.text} anchorX="left" anchorY="top">
          {displayCase(TITLE.title)}
        </Text>
        <Text position={[0, 3.14, 0]} fontSize={TYPE.kicker} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
          {TITLE.subtitle}
        </Text>
      </group>
      <WallText position={[welcome.minX + 0.4, wall]} facing="south" layout={THESIS_LAYOUT} {...THESIS} />
      <ExhibitionPlan exhibition="dark-patterns" position={[welcome.minX + 0.02, 1.75, (welcome.minZ + welcome.maxZ) / 2]} facing="east" here={[origin[0] + welcome.minX + 1.5, origin[1] + welcome.maxZ - 1.2]} />

      <Screen position={[east, 1.75, -10.6]} facing="west" width={2.6} height={1.6} title="This exhibition closes in" urgent={time} body={`${watching} people are looking at this room right now.`} primary="Continue" />
      <PatternLabel position={[east, 2.15, -14.5]} facing="west" pattern={PATTERNS.urgency} width={1.3} />
      <PatternLabel position={[east, 1.4, -14.5]} facing="west" pattern={PATTERNS.social} width={1.3} />
    </>
  )
}

/* II — CHECKOUT. A long counter; the receipt along the far wall fills in as the visitor walks. */

const LINE_X = [-7.1, -9.0, -10.9, -12.8, -14.7, -16.6]
const BOX = { x: -11, z: -16.6 }

function ReceiptLine({ index }: { index: number }) {
  const line = RECEIPT[index]
  const x = LINE_X[index]
  const { origin } = useRoom()
  const [shown, setShown] = useState(index === 0)
  // Each fee appears once the visitor has walked past the one before it.
  useRoomFrame(({ camera }) => {
    if (!shown && camera.position.x - origin[0] < x + 1.6 && camera.position.z - origin[1] < checkout.maxZ) setShown(true)
  })
  // The mounts hang empty along the wall; each fee appears in its own as the visitor passes.
  return (
    <group position={[x, 1.9, checkout.minZ + 0.002]}>
      <WallMount width={1.7} height={0.62}>
        {shown && (
          <>
            <mesh material={basicMaterial(SALES.surface)}>
              <planeGeometry args={[1.7, 0.62]} />
            </mesh>
            <Text position={[-0.72, 0.19, 0.003]} fontSize={0.075} color={SALES.ink} anchorX="left" anchorY="top">
              {line.item}
            </Text>
            <Text position={[-0.72, -0.02, 0.003]} fontSize={0.12} color={SALES.ink} anchorX="left" anchorY="top">
              {line.price === 0 ? 'FREE' : `+ ${euros(line.price)}`}
            </Text>
            {line.note && line.price > 0 && (
              <Text position={[0.72, 0.19, 0.003]} fontSize={0.032} letterSpacing={0.1} color={SALES.quiet} anchorX="right" anchorY="top">
                {line.note}
              </Text>
            )}
          </>
        )}
      </WallMount>
    </group>
  )
}

/** A box ticked for the visitor. UNCHECK it, and a moment later it ticks itself again. */
function PreselectedBox() {
  const [checked, setChecked] = useState(true)
  const unchecked = useRef<number | null>(null)
  const play = useSound()
  useObstacle('preselected', box(BOX.x, BOX.z, 1.1, 0.7))
  useFocusTarget({
    id: 'preselected',
    position: [BOX.x, 1.1, BOX.z],
    distance: 2.4,
    facing: 0.55,
    card: { index: 'BOX', year: 'CHECKOUT', category: 'SNEAK INTO BASKET', title: 'Booking protection', description: 'A box ticked for you: “Add booking protection, €6.00”. Untick it and, a moment later, it is ticked again.' },
    labelled: true,
    prompt: checked ? 'UNCHECK' : null,
    onInteract: () => {
      setChecked(false)
      unchecked.current = 0
      play('button-flat', [BOX.x, 1.1, BOX.z])
    },
  })
  useRoomFrame((_, delta) => {
    if (unchecked.current === null) return
    unchecked.current += delta
    if (unchecked.current > 2.5) {
      unchecked.current = null
      setChecked(true)
      play('captcha-check', [BOX.x, 1.1, BOX.z])
    }
  })

  return (
    <group position={[BOX.x, 0, BOX.z]}>
      <mesh position={[0, 0.5, 0]} material={PLINTH_MATERIAL}>
        <boxGeometry args={[1, 1, 0.6]} />
      </mesh>
      {/* Face up, the right way round for the visitor standing on the aisle side. */}
      <group position={[0, 1.004, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
        <mesh material={basicMaterial(SALES.surface)}>
          <planeGeometry args={[0.9, 0.5]} />
        </mesh>
        <mesh position={[-0.33, 0, 0.002]} geometry={roundedRect(0.12, 0.12, 0.02)} material={basicMaterial(checked ? SALES.button : '#c9c6bf')} />
        {/* The tick: two strokes. */}
        {checked && (
          <>
            <mesh position={[-0.348, -0.008, 0.004]} rotation={[0, 0, 0.8]} material={basicMaterial('#ffffff')}>
              <planeGeometry args={[0.045, 0.014]} />
            </mesh>
            <mesh position={[-0.318, 0.008, 0.004]} rotation={[0, 0, -0.9]} material={basicMaterial('#ffffff')}>
              <planeGeometry args={[0.08, 0.014]} />
            </mesh>
          </>
        )}
        <Text position={[-0.24, 0.03, 0.003]} fontSize={0.045} maxWidth={0.6} color={SALES.ink} anchorX="left" anchorY="middle">
          Add booking protection
        </Text>
        <Text position={[-0.24, -0.06, 0.003]} fontSize={0.03} color={SALES.quiet} anchorX="left" anchorY="middle">
          {checked ? 'Recommended · €6.00' : 'Are you sure? Most people keep it.'}
        </Text>
      </group>
    </group>
  )
}

function Checkout() {
  const { origin } = useRoom()
  const stayDoor = localDoor(DOORS.stayDoor, origin)
  const leaveDoor = localDoor(DOORS.leaveDoor, origin)
  const wall = checkout.minZ + 0.03

  return (
    <>
      <StaticMerge>
        {[checkout.minX + 3, checkout.minX + 9, checkout.minX + 15].map((x) => (
          <Luminaire key={x} position={[x, checkout.height - 0.004, (checkout.minZ + checkout.maxZ) / 2]} size={[4.2, 0.14]} palette={sales} />
        ))}
        {/* The big door is framed in light. */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[stayDoor.center + side * (stayDoor.width / 2 + 0.07), stayDoor.height / 2, wall + 0.01]} material={basicMaterial('#fbf6e8')}>
            <planeGeometry args={[0.06, stayDoor.height]} />
          </mesh>
        ))}
        <mesh position={[stayDoor.center, stayDoor.height + 0.07, wall + 0.01]} material={basicMaterial('#fbf6e8')}>
          <planeGeometry args={[stayDoor.width + 0.2, 0.06]} />
        </mesh>
      </StaticMerge>
      <LightPool position={[stayDoor.center, 0.004, checkout.minZ + 1]} size={[4, 2.2]} color="#fbf0d8" strength={0.16} />

      {/* The friendly way: a button the size of a door. */}
      <group position={[stayDoor.center, stayDoor.height + 0.36, wall]}>
        <mesh geometry={roundedRect(3.1, 0.36, 0.18)} material={basicMaterial(SALES.button)} />
        <Text position={[0, 0, 0.003]} fontSize={0.12} letterSpacing={0.06} color="#ffffff" anchorX="center" anchorY="middle">
          {CONFIRMSHAMING.stay}
        </Text>
      </group>
      {/* The other way, at the far end, in small grey type. */}
      <Text position={[leaveDoor.center, leaveDoor.height + 0.16, wall]} fontSize={0.035} maxWidth={1.3} textAlign="center" color={SALES.quiet} anchorX="center" anchorY="bottom">
        {CONFIRMSHAMING.leave}
      </Text>
      <PatternLabel position={[checkout.minX + 0.02, 1.9, -16.2]} facing="east" pattern={PATTERNS.shaming} width={1.6} />

      {RECEIPT.map((_, i) => (
        <ReceiptLine key={i} index={i} />
      ))}
      <group position={[-17.6, 2.05, checkout.maxZ - 0.03]} rotation={[0, Math.PI, 0]}>
        <Text fontSize={TYPE.sign} letterSpacing={TYPE.tracking} color={INK.muted} anchorX="left" anchorY="top">
          TOTAL
        </Text>
        <Text face="display" position={[0, -0.12, 0]} fontSize={0.36} color={INK.text} anchorX="left" anchorY="top">
          {euros(TOTAL)}
        </Text>
      </group>
      <PatternLabel position={[-6.0, 1.55, checkout.maxZ - 0.03]} facing="north" pattern={PATTERNS.drip} width={1.4} />
      <PatternLabel position={[-12.1, 1.55, checkout.maxZ - 0.03]} facing="north" pattern={PATTERNS.basket} width={1.4} />
      <PreselectedBox />
    </>
  )
}

/* III — LEAVING. A small room that thanks you for staying; and the long way out. */

function Stay() {
  const wall = stay.minZ + 0.02
  return (
    <>
      <StaticMerge>
        <Luminaire position={[(stay.minX + stay.maxX) / 2, stay.height - 0.004, (stay.minZ + stay.maxZ) / 2]} size={[3.6, 1.6]} palette={PALETTES.success} />
      </StaticMerge>
      <Screen position={[(stay.minX + stay.maxX) / 2, 1.7, wall]} facing="south" width={3} height={1.3} title={CONFIRMSHAMING.thanks} body={CONFIRMSHAMING.thanksLine} primary="Explore our plans" />
    </>
  )
}

/** One screen at the end of each corridor of the cancellation flow. */
const SCREENS: { cell: typeof flow1; end: 'east' | 'west' }[] = [
  { cell: flow1, end: 'east' },
  { cell: flow2, end: 'west' },
  { cell: flow3, end: 'east' },
  { cell: flow4, end: 'west' },
]

function Leaving() {
  return (
    <>
      <StaticMerge>
        {[flow1, flow2, flow3, flow4].map((cell) => (
          <Luminaire key={cell.minZ} position={[(cell.minX + cell.maxX) / 2, cell.height - 0.004, (cell.minZ + cell.maxZ) / 2]} size={[cell.maxX - cell.minX - 2, 0.08]} palette={flow} />
        ))}
      </StaticMerge>
      {SCREENS.map(({ cell, end }, i) => {
        const x = end === 'east' ? cell.maxX - 0.02 : cell.minX + 0.02
        const z = (cell.minZ + cell.maxZ) / 2
        const screen = FLOW[i]
        return (
          <group key={i}>
            <Screen position={[x, 1.45, z]} facing={end === 'east' ? 'west' : 'east'} width={1.95} height={1.35} title={screen.title} body={screen.body} primary={screen.yes} secondary={screen.no} />
            <LightPool position={[x + (end === 'east' ? -1.2 : 1.2), 0.004, z]} size={[2.4, 2]} color="#e8eef5" strength={0.06} />
          </group>
        )
      })}
      {/* On the first corridor's far wall, to the left of the visitor as they come through the small door. */}
      <PatternLabel position={[flow1.minX + 2.2, 1.75, flow1.minZ + 0.02]} facing="south" pattern={PATTERNS.motel} width={1.6} />
    </>
  )
}

/* IV — CANCELLED. The afterword, and a plain door back to the lobby. */

function Cancelled() {
  const play = useSound()
  const wall = cancelled.minZ + 0.02
  const door = -9.6
  return (
    <>
      <StaticMerge>
        <Luminaire position={[(cancelled.minX + cancelled.maxX) / 2, cancelled.height - 0.004, cancelled.minZ + 1.6]} size={[6.4, 0.12]} palette={sales} />
      </StaticMerge>
      <LightPool position={[-15.6, 2, wall - 0.008]} rotation={[0, 0, 0]} size={[6.4, 3]} color="#eef2f5" strength={0.06} />
      <Text position={[cancelled.minX + 0.4, 3.0, wall]} fontSize={0.075} letterSpacing={0.14} color={INK.muted} anchorX="left" anchorY="top">
        YOUR SUBSCRIPTION HAS BEEN CANCELLED.
      </Text>
      <WallText position={[cancelled.minX + 0.4, wall]} facing="south" layout={AFTERWORD_LAYOUT} {...AFTERWORD} />
      <DoorLeaf
        id="dark-return"
        x={door}
        wall={wall}
        palette={sales}
        sign="LOBBY"
        prompt="RETURN TO THE LOBBY"
        card={CARDS.exit}
        onUse={() => {
          play('exit-door', [door, 1.2, wall])
          navigation.returnToLobby('dark-patterns')
        }}
      />
    </>
  )
}

/**
 * Dark Patterns, the museum's temporary exhibition, in its own wing off the lobby:
 * a purchase and a cancellation, walked. The shop's signs use the patterns on the
 * visitor; small labels, in the museum's voice, name them.
 */
export function DarkPatternsRoom() {
  const { origin } = useRoom()
  const door = (key: keyof typeof DOORS) => localDoor(DOORS[key], origin)
  const stayDoor = door('stayDoor')
  const leaveDoor = door('leaveDoor')
  const split = (stayDoor.center + leaveDoor.center) / 2

  return (
    <>
      <StaticMerge>
        <RoomShell {...welcome} palette={sales} south={{ door: door('darkEntry'), split: true }} north={{ door: door('checkoutEntry'), split: true }} />
        {/* The checkout's north wall has two doors, so it is built in two lengths. */}
        <RoomShell {...checkout} palette={sales} south={{ door: door('checkoutEntry'), split: true }} north={null} />
        <Wall axis="x" at={checkout.minZ - t / 2} from={checkout.minX - t} to={split} height={checkout.height} palette={sales} door={leaveDoor} />
        <Wall axis="x" at={checkout.minZ - t / 2} from={split} to={checkout.maxX + t} height={checkout.height} palette={sales} door={stayDoor} />
        <RoomShell {...stay} palette={PALETTES.empty} south={null} north={{}} />
        <RoomShell {...flow1} palette={flow} south={null} north={{ door: door('flow12') }} />
        <RoomShell {...flow2} palette={flow} south={null} north={{ door: door('flow23') }} />
        <RoomShell {...flow3} palette={flow} south={null} north={{ door: door('flow34') }} />
        <RoomShell {...flow4} palette={flow} south={null} north={null} />
        <RoomShell {...cancelled} palette={sales} south={{ door: door('cancelDoor') }} north={{}} />
      </StaticMerge>

      <RoomContents cells={[0]}>
        <Welcome />
      </RoomContents>
      <RoomContents cells={[1]}>
        <Checkout />
      </RoomContents>
      <RoomContents cells={[2]}>
        <Stay />
      </RoomContents>
      <RoomContents cells={[3, 4, 5, 6]}>
        <Leaving />
      </RoomContents>
      <RoomContents cells={[7]}>
        <Cancelled />
      </RoomContents>
    </>
  )
}

