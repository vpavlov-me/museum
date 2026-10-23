# Claude Code project guide

## Product intent

Interface Museum is an experimental 3D editorial project. Visitors walk through authored spaces and discover interface history, product-design observations and interactive artifacts as if they were in a physical museum.

The reference quality bar is closer to an exhibition, installation or art-directed WebGL experience than to a conventional portfolio site.

## Core principles

1. **Spatial first.** Every feature should improve exploration, orientation or the feeling of being inside a place.
2. **One thesis per room.** Rooms should be conceptually focused, not collections of unrelated UI screenshots.
3. **Editorial text belongs to architecture.** Use short exhibition texts on walls. Do not turn the scene into long-form reading in 3D.
4. **Artifacts should explain ideas visually.** Prefer physicalized interface elements, timelines, transformations and interactive objects.
5. **Restraint over spectacle.** Avoid decorative particles, excessive bloom, gratuitous shaders or game-like UI unless they support a room's idea.
6. **Desktop first.** Keyboard + mouse exploration is the primary interaction for now.
7. **Performance matters.** Keep geometry simple, reuse materials, cap DPR, lazy-load heavy assets and avoid unnecessary render work.

## Technical direction

Current stack:

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- Drei

Keep the project compatible with static deployment on Vercel.

## Architecture expectations

As the project grows, separate these concerns:

- `scene/` — reusable museum primitives, lighting, controls and architecture;
- `rooms/` — individual authored rooms;
- `content/` — structured editorial content and exhibit metadata;
- `ui/` — 2D overlays and accessibility fallbacks;
- `assets/` — optimized models, textures and audio.

Do not introduce this folder structure prematurely if a change is still small, but move toward it once a second room is implemented.

## Visual language

- light, modern galleries (v3): tall rooms (lobby 9 m, hall 12 m) of seamless grey cast concrete on
  a shadow gap, wide oak boards, plinths in the floor's oak, and daylight only: a band of frosted
  windows under the ceiling (`components/Clerestory`), no lamps or spots (`PALETTES.lobby` and
  `PALETTES.hall`, `wallKind: 'concrete'`, `floorKind: 'oak'`); the closed rooms
  keep their dark stone and plaster until they are rebuilt;
- warm off-white typography;
- sparse accent colors reserved for exhibits;
- large editorial typography;
- strong negative space;
- gallery-style labels and metadata;
- minimal HUD;
- no generic SaaS visual patterns.

## Interaction rules

- Walking speed should feel slow enough for an exhibition.
- Avoid sprinting, jumping or game mechanics.
- Important content must not depend on precision clicking while pointer lock is active.
- Prefer proximity, gaze or clear interaction prompts.
- Always preserve an obvious way to release pointer lock.

## Current state: v3, one room done properly (#48)

v1 shipped as one exhibition of three rooms (#12); v2 (#20, #21) made it a small museum with a
lobby and three exhibitions. v3 narrows it on purpose: **the lobby and one room, The Button**, made
as good as they can be before the museum grows again. Rooms 02–03, Interface Archaeology and Dark
Patterns are **closed, not deleted**: `CLOSED` in `museum/roomRegistry.ts` and `in-preparation` in
`museum/exhibitions.ts`; their code stays in `src/rooms/`.

- Follow #48 step by step: concept (approved before code), modern architecture, exhibits, the essay
  on the walls, the key visual, polish.
- **An exhibition, not a route.** One open hall the visitor can see from its entrance and walk in any
  order; free-standing walls divide it, nothing has to be passed through in sequence.
- **Exhibits are objects** on plinths, in cases or on walls, each with a label (description and a
  short introduction). The essay is set on the walls in fragments and complete in the text version.
- **No interactive mechanics for now:** walking and looking only. Nothing blocks the way and nothing
  has to be pressed to go on. Considered interactions come later, by design.
- **Modern architecture,** neither classical nor futuristic (Chipperfield, Zumthor, SANAA, Beyeler):
  cast concrete, oak boards, shadow gaps, daylight from high windows.
- Design for three to five exhibitions, not more. Do not start an exhibition, room or new exhibit
  without an approved issue; ideas go into the roadmap (#48) as backlog first.
- Every merge to `main` deploys: each change must leave walking, the guided tour and the text
  version complete, with entry, colophon, metadata and the OG image matching the exhibitions.
- Otherwise, only fix bugs, regressions, accessibility and performance problems, small copy errors
  and deployment issues.

## How the museum is built (read before changing it)

- **Plan:** `museum/roomRegistry.ts` defines every space, its cells, doors, zones and spawn point.
  Walkable floor, which rooms open into which, and cell-to-cell sight lines are all derived from it.
- **Exhibitions:** `museum/exhibitions.ts` lists them (number, title, status, URL slug, spaces,
  lobby door, start point, chunk). Each exhibition's rooms are one dynamic import
  (`rooms/permanent.ts`, `rooms/archaeology/archaeology.ts`, `rooms/dark-patterns/dark-patterns.ts`) loaded by `museum/exhibitionLoader.ts`; its
  lobby door stays shut until they are mounted and compiled. Never import an exhibition's rooms
  statically from shared code. Each exhibition ends at a `DoorLeaf` that calls
  `navigation.returnToLobby`; the lobby's front door calls `navigation.leave`.
- **Navigation:** `/exhibitions/<slug>` starts a visit in that exhibition (`vercel.json` rewrites
  it); the address bar follows the exhibition the visitor is in. `P` opens the plan (`ui/Plan`).
  `museum/events.ts` is the analytics surface: add an event there, never instrument per frame.
- **Visibility and activation:** put everything except merged architecture in
  `<RoomContents cells={[…]}>`. Animate with `useRoomFrame`. The v3 galleries are lit by daylight
  alone; the closed rooms light exhibits with `Downlight` fixtures (the shared `LightRig` has a
  budget of 6 spotlights). Contents more than two doors away
  are neither drawn, animated nor lit.
- **Interaction:** `useObstacle` blocks the way, and `useFocusTarget` makes things focusable and
  usable with `E`; the guided tour's action button does the same. Things that block the way must
  never close on the visitor.
- **Three ways to visit:** walk (desktop), guided tour (`museum/tour.ts`: one route per exhibition,
  chosen in the lobby, each ending at its door back to the lobby; every stop must stay reachable,
  and may set a `pitch` to look down) and the text version (one section per exhibition, built from
  each room's `content.ts`). Whatever changes in a room must still work in all three.
- **Passages:** the low, dark turn between rooms is `components/TurnPassage` (`turn="west"` mirrors it); a new exhibition gets one.
- **Identity:** `identity.ts` and `styles.css` hold the ink, the type and the name; use them, not
  new hex values (`INK_ON_LIGHT` on light stone). Every 3D text uses `components/Text`: Inter by
  default; `face="display"` (Instrument Serif) for titles, chapter and object names and large
  figures, set with `displayCase` (title case, never capitals). Kickers use `TYPE.kicker` /
  `TYPE.sign` with `TYPE.tracking`. Both faces are OFL and self-hosted.
- **Materials:** `scene/materials.ts` palettes give every space its stone floor, plaster walls and
  trim, mapped by world position (no UVs needed) from textures generated at idle time; `Wall` adds
  skirting, shadow gap and architraves. Reflections come from one generated environment
  (`scene/Lighting`). No image textures.
- **Sound:** synthesised in `audio/`. It is optional, never carries information, and only starts
  after a click.
- **Measuring:** `npm run build:profile` is a production build with the debug bridge and the
  `` ` `` readout. Never ship either in production.
- **Tests:** `e2e/` walks the museum through the profile build's debug bridge, in all three ways
  to visit. CI runs it on every PR; a PR merges only when it passes. A new room adds its tour
  stops, and the walk and guided specs pick them up; the shared helpers are in `e2e/museum.ts`.
