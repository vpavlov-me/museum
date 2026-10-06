# Interface Museum

A small museum about the interfaces we use every day without noticing them, given physical form.
You walk through it in a browser: from a lobby into two exhibitions, and back.

**Visit:** https://museum-dquality.vercel.app ·
[permanent exhibition](https://museum-dquality.vercel.app/exhibitions/permanent) ·
[Interface Archaeology](https://museum-dquality.vercel.app/exhibitions/archaeology)

## The museum

Every visit starts in the **lobby**. Its north wall holds the three entrances, each signed beside
its door; a line on the floor leads to the recommended start. Every exhibition ends at a door back
to the lobby, and the lobby's front door leaves the museum.

| | Exhibition | Idea |
|---|---|---|
| **01** | **Permanent Exhibition** | Three rooms: **The Button** (interface as an object), **Things We Somehow Accepted** (interface behavior as architecture) and **Interface States** (interface state as the state of the world). |
| **02** | **Interface Archaeology** | The interface outside its own time: our interfaces as a future archive digs them up and catalogues them, often wrongly. |
| 03 | Temporary Exhibition | In preparation. |

Each room holds one idea, told through space first and short wall texts second.

## Ways to visit

| Mode | For | Controls |
|---|---|---|
| **Walk** | desktop with keyboard and mouse | `W A S D` walk · mouse look · `E` interact · `P` plan · `Esc` pause · `M` sound |
| **Guided tour** | touch screens, or anyone who prefers not to steer | choose an exhibition in the lobby · Next / Back (or ← →) · drag to look · tap the action |
| **Text** | browsers without WebGL, screen readers, anyone who would rather read | each exhibition, every wall and label, in order |

The mode is suggested from what the device can do. Visitors can always pick another one from the
entry screen. A plan of the museum (`P`, or *Plan* in the pause screen and on the tour) shows
where the visitor stands and which exhibitions they have visited. Sound is quiet, optional and off
on request (`M`). The museum is complete without it.

## Run locally

```bash
npm install
npm run dev             # development, with the debug bridge and ` frame readout
npm run build           # production build in dist/
npm run preview         # serve the production build
npm run build:profile   # production build plus measuring tools, in dist-profile/
```

The project deploys as a static site (Vercel); no server is involved. `vercel.json` rewrites
`/exhibitions/*` to the page, so direct links to an exhibition work.

## Stack

Vite · React · TypeScript · Three.js · React Three Fiber · Drei (Text). Sound is native Web Audio.
There are no other runtime dependencies.

## How it is built

```
src/
  identity.ts  name, credits, ink colors, typeface, signage type scale (mirrored in styles.css)
  museum/      the plan (room registry: spaces, cells, doors, zones), the exhibitions and their
               loading, navigation (direct links, back to the lobby), events, shared store, room
               context, visibility and activation, capabilities, guided tour routes
  scene/       world, player, collision, focus + E, light rig and fixtures, materials, precompile
  audio/       engine, synthesis, sound catalogue, room tone
  components/  architecture and signage: RoomShell, Wall, TurnPassage, DoorLeaf, WallText, Text…
  rooms/       lobby; permanent.ts (entrance, the-button, passage, accepted, states, colophon) and
               archaeology/, each exhibition one chunk (each room with its content.ts)
  ui/          entry, HUD, pause, plan, guided tour controls, colophon, text version, notices
```

- **The plan is data.** Rooms are authored in local coordinates and placed by the registry.
  Walkable floor, which spaces open into which, and cell-to-cell sight lines are derived from it.
- **Exhibitions load when the visitor heads for them.** The first load is the lobby. An
  exhibition's rooms are fetched when the visitor walks up to its door (or follows a direct link,
  or chooses it on the tour), mounted and compiled; only then does its door open.
- **Only what can be seen does work.** Contents, animations and the six pooled spotlights belong
  to the cells within two doors of the visitor. Architecture is merged per material and always drawn.
- **Shaders compile behind closed doors:** the lobby's before the front door opens, an exhibition's
  before its door does, so walking into a new room never stalls.
- **Content is data.** Each room's `content.ts` feeds its walls, its labels, screen-reader
  announcements and the text version.
- **Events, not tracking.** `museum/events.ts` names what a visitor does (entering an exhibition,
  finishing one, opening the plan) as `museum:event`s on the window. Nothing is sent anywhere.

See `CLAUDE.md` for the working rules.

## Assets and credits

- **Exhibition:** conceived, written, designed and built by Vladimir Pavlov, 2026.
- **Typeface:** Inter by Rasmus Andersson, SIL Open Font License 1.1. Subset and self-hosted in
  `public/fonts/`, with the license alongside.
- **Sound:** synthesised in code (`src/audio/`); there are no audio files.
- **Images:** the social preview (`public/og.png`), favicon and touch icon were made for this project
  from its own typography. Interface imagery in the rooms (the CAPTCHA tiles, feed posts, badges) is
  procedural, with no third-party artwork or branding.
- **Code license:** not yet chosen. Until one is added, the code is all rights reserved.
