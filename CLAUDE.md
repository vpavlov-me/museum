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

## Current state: v1 is frozen

The first public version is **Rooms 01–03** (The Button · Things We Somehow Accepted · Interface
States), with the entrance, the colophon and the exit. Its scope is frozen.

- **Room 04 and any further rooms are post-launch work.** Do not start them, or other new
  exhibits, without an approved issue. Candidate directions are listed in the v1 roadmap issue (#12).
- Between releases, only fix bugs, regressions, accessibility and performance problems, small copy
  errors and deployment issues. Record anything else as a post-launch issue instead of building it.

## How the museum is built (read before changing it)

- **Plan:** `museum/roomRegistry.ts` defines every space, its cells, doors, zones and spawn point.
  Walkable floor, which rooms open into which, and cell-to-cell sight lines are all derived from it.
- **Visibility and activation:** put everything except merged architecture in
  `<RoomContents cells={[…]}>`. Animate with `useRoomFrame`. Light exhibits with `Downlight`
  fixtures; the shared `LightRig` has a budget of 6 spotlights. Contents more than two doors away
  are neither drawn, animated nor lit.
- **Interaction:** `useObstacle` blocks the way, and `useFocusTarget` makes things focusable and
  usable with `E`; the guided tour's action button does the same. Things that block the way must
  never close on the visitor.
- **Three ways to visit:** walk (desktop), guided tour (`museum/tour.ts`; every stop must stay
  reachable) and the text version (built from each room's `content.ts`). Whatever changes in a room
  must still work in all three.
- **Identity:** `identity.ts` and `styles.css` hold the ink, the type and the name; use them, not
  new hex values. Every 3D text uses `components/Text` (Inter, self-hosted).
- **Sound:** synthesised in `audio/`. It is optional, never carries information, and only starts
  after a click.
- **Measuring:** `npm run build:profile` is a production build with the debug bridge and the
  `` ` `` readout. Never ship either in production.
