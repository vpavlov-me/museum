# Interface Museum

An exhibition in four rooms about the interfaces we use every day without noticing them, given
physical form. You walk through it in a browser: buttons on plinths, interface conventions turned
into architecture, interface states that become the state of the room you are standing in, and
our interfaces as a future archive might dig them up.

**Visit:** https://museum-dquality.vercel.app

## The exhibition

| Room | Idea |
|---|---|
| **01 The Button** | Interface as an object: four buttons, four eras, one promise. |
| **02 Things We Somehow Accepted** | Interface behavior as architecture: the conventions that block, interrupt and keep you inside. |
| **03 Interface States** | Interface state as the state of the world: what happens between the ideal screens. |
| **04 Interface Archaeology** | The interface outside its own time: our interfaces as a future archive finds and catalogues them. |

Each room holds one idea, told through space first and short wall texts second. A colophon and an
exit close the visit.

## Ways to visit

| Mode | For | Controls |
|---|---|---|
| **Walk** | desktop with keyboard and mouse | `W A S D` walk · mouse look · `E` interact · `Esc` pause · `M` sound |
| **Guided tour** | touch screens, or anyone who prefers not to steer | Next / Back (or ← →) · drag to look · tap the action |
| **Text** | browsers without WebGL, screen readers, anyone who would rather read | every wall and label, in order |

The mode is suggested from what the device can do. Visitors can always pick another one from the
entry screen. Sound is quiet, optional and off on request (`M`). The museum is complete without it.

## Run locally

```bash
npm install
npm run dev             # development, with the debug bridge and ` frame readout
npm run build           # production build in dist/
npm run preview         # serve the production build
npm run build:profile   # production build plus measuring tools, in dist-profile/
```

The project deploys as a static site (Vercel); no server is involved.

## Stack

Vite · React · TypeScript · Three.js · React Three Fiber · Drei (Text). Sound is native Web Audio.
There are no other runtime dependencies.

## How it is built

```
src/
  identity.ts  name, credits, ink colors, typeface, signage type scale (mirrored in styles.css)
  museum/      the plan (room registry: spaces, cells, doors, zones), shared store, room context,
               visibility and activation, capabilities, guided tour stops
  scene/       world, player, collision, focus + E, light rig and fixtures, materials, precompile
  audio/       engine, synthesis, sound catalogue, room tone
  components/  architecture and signage: RoomShell, Wall, WallText, ChapterMark, ExhibitLabel, Text…
  rooms/       entrance, the-button, passage, accepted, states, archaeology, colophon (each with its content.ts)
  ui/          entry, HUD, pause, guided tour controls, colophon, text exhibition, notices
```

- **The plan is data.** Rooms are authored in local coordinates and placed by the registry.
  Walkable floor, which spaces open into which, and cell-to-cell sight lines are derived from it.
- **Only what can be seen does work.** Contents, animations and the six pooled spotlights belong
  to the cells within two doors of the visitor. Architecture is merged per material and always drawn.
- **Every shader compiles before the front door opens,** so walking into a new room never stalls.
- **Content is data.** Each room's `content.ts` feeds its walls, its labels, screen-reader
  announcements and the text version.

See `CLAUDE.md` for the working rules (v1 is scope-frozen; new rooms are post-launch).

## Assets and credits

- **Exhibition:** conceived, written, designed and built by Vladimir Pavlov, 2026.
- **Typeface:** Inter by Rasmus Andersson, SIL Open Font License 1.1. Subset and self-hosted in
  `public/fonts/`, with the license alongside.
- **Sound:** synthesised in code (`src/audio/`); there are no audio files.
- **Images:** the social preview (`public/og.png`), favicon and touch icon were made for this project
  from its own typography. Interface imagery in the rooms (the CAPTCHA tiles, feed posts, badges) is
  procedural, with no third-party artwork or branding.
- **Code license:** not yet chosen. Until one is added, the code is all rights reserved.
