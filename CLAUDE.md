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

- dark, neutral architectural shell;
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

## Current state: v2, a small museum

v1 shipped as one exhibition of three rooms (#12). v2 (#20, #21) makes it a small museum: a
**lobby** where every visit starts and ends, the **Permanent Exhibition** (Rooms 01–03, unchanged),
**Interface Archaeology** in its own wing (#22), and a temporary exhibition in preparation.

- Design for three to five exhibitions, not more. Do not start an exhibition, room or new exhibit
  without an approved issue; ideas go into the v2 roadmap (#21) as backlog first.
- Every merge to `main` deploys: each change must leave walking, the guided tour and the text
  version complete, with entry, colophon, metadata and the OG image matching the exhibitions.
- Otherwise, only fix bugs, regressions, accessibility and performance problems, small copy errors
  and deployment issues.

## How the museum is built (read before changing it)

- **Plan:** `museum/roomRegistry.ts` defines every space, its cells, doors, zones and spawn point.
  Walkable floor, which rooms open into which, and cell-to-cell sight lines are all derived from it.
- **Exhibitions:** `museum/exhibitions.ts` lists them (number, title, status, URL slug, spaces,
  lobby door, start point, chunk). Each exhibition's rooms are one dynamic import
  (`rooms/permanent.ts`, `rooms/archaeology/index.ts`) loaded by `museum/exhibitionLoader.ts`; its
  lobby door stays shut until they are mounted and compiled. Never import an exhibition's rooms
  statically from shared code. Each exhibition ends at a `DoorLeaf` that calls
  `navigation.returnToLobby`; the lobby's front door calls `navigation.leave`.
- **Navigation:** `/exhibitions/<slug>` starts a visit in that exhibition (`vercel.json` rewrites
  it); the address bar follows the exhibition the visitor is in. `P` opens the plan (`ui/Plan`).
  `museum/events.ts` is the analytics surface: add an event there, never instrument per frame.
- **Visibility and activation:** put everything except merged architecture in
  `<RoomContents cells={[…]}>`. Animate with `useRoomFrame`. Light exhibits with `Downlight`
  fixtures; the shared `LightRig` has a budget of 6 spotlights. Contents more than two doors away
  are neither drawn, animated nor lit.
- **Interaction:** `useObstacle` blocks the way, and `useFocusTarget` makes things focusable and
  usable with `E`; the guided tour's action button does the same. Things that block the way must
  never close on the visitor.
- **Three ways to visit:** walk (desktop), guided tour (`museum/tour.ts`: one route per exhibition,
  chosen in the lobby, each ending at its door back to the lobby; every stop must stay reachable,
  and may set a `pitch` to look down) and the text version (one section per exhibition, built from
  each room's `content.ts`). Whatever changes in a room must still work in all three.
- **Passages:** the low, dark turn between rooms is `components/TurnPassage`; a new room gets one.
- **Identity:** `identity.ts` and `styles.css` hold the ink, the type and the name; use them, not
  new hex values. Every 3D text uses `components/Text` (Inter, self-hosted).
- **Sound:** synthesised in `audio/`. It is optional, never carries information, and only starts
  after a click.
- **Measuring:** `npm run build:profile` is a production build with the debug bridge and the
  `` ` `` readout. Never ship either in production.
