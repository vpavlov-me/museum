# Interface Museum

An experimental first-person 3D exhibition about interface culture. The project explores whether product-design ideas, interface history and editorial writing can work as a physical museum space that visitors discover by walking through it.

## Prototype 01 — The Button

The first vertical slice is intentionally small. It tests:

- first-person navigation in a browser;
- museum-scale typography and wall essays;
- interface elements presented as physical artifacts;
- proximity-based exhibit descriptions;
- a restrained editorial / exhibition visual language;
- a content structure that can grow into multiple rooms.

## Prototype 02 — From room to museum

The museum became one continuous walk with a shared room registry, collision and
proximity + gaze + `E` interaction. Room 01's four buttons answer a press in the language of their era;
Room 02 turns interface behavior into architecture.

## Prototype 03 — Spatial direction & atmosphere

Art direction through space, not more content:

```
ENTRANCE → 01 THE BUTTON → threshold (low, narrow, two 90° turns) →
02 THINGS WE SOMEHOW ACCEPTED
     I   INTERRUPT        cookie banner, modals that appear as you approach
     ·   pause            low, quiet, the chapter II title
     II  PROVE / ATTEND   one badge on a plinth, then many; the CAPTCHA gate
     III WAIT / CONTINUE  skeleton panels as partitions → the feed → closed passage (Room 03)
```

- No straight view runs through the museum: Room 01's exit meets a wall and turns, and every
  opening in Room 02 is offset from the last, so the visitor keeps reorienting.
- Each kind of space has its own palette (`scene/materials.ts`): a lighter entrance, a neutral
  gallery, a dark threshold and a cooler, harsher Room 02. Realtime light is reserved for exhibits
  (`Downlight`); visible luminaires and painted light pools do the rest.
- Exhibits carry physical labels. The floating card is kept only for the feed, whose subject appears
  while walking; every focused object is still announced to screen readers.
- `E` is kept for deliberate acts (press, accept, close, verify, mark as read). Modals, skeleton
  screens, badges and the feed respond to approach.
- Static architecture is merged per material (`StaticMerge`); badges and feed cards are instanced.
  In development, `` ` `` toggles a small frame-time / draw-call readout.

### Controls

- `W A S D` — move
- Mouse — look
- `E` — interact with the object in focus
- `Esc` — release pointer lock

Desktop is the target for this prototype.

## Stack

- Vite
- React
- TypeScript
- Three.js
- React Three Fiber
- Drei

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Direction

The museum should feel like an authored exhibition rather than a portfolio placed inside a 3D room. Each room should have one clear thesis, a small number of artifacts and short editorial texts integrated into the architecture.

Potential rooms:

1. **The Button** — evolution of digital affordance.
2. **Things We Somehow Accepted** — cookie banners, CAPTCHA, infinite scroll, notification badges, autoplay and other normalized interface conventions.
3. **Interface States** — loading, empty, error, success, offline and locked as spatial experiences.
4. **Interfaces That Changed How We Design** — a subjective collection of influential products and patterns.

## Code structure

```
src/
  museum/      plan and shared state: room registry (bounds, cells, doors, spawn), types, store, room context
  scene/       MuseumWorld, Player, Controls, Collision, Interaction (focus + E), Lighting,
               materials (palettes), Light (Downlight, LightPool, Luminaire), StaticMerge, geometry
  components/  RoomShell, Wall, WallText, ChapterMark, Plinth, ExhibitLabel
  rooms/       entrance/, the-button/, passage/, accepted/ — each owns its composition and content
  ui/          HUD, ExhibitCard, Intro, Pause
```

Rooms are authored in local coordinates and placed at their registry `origin`. They register
obstacles with `useObstacle` and focus targets with `useFocusTarget`; walkable floor is derived
from the registry, so adding a room means adding a registry entry, its doors and its component.
A room may be several rectangular cells with their own ceiling heights (Room 02 is five); the
taller neighbour builds a shared wall. Architecture uses palette materials so it can be merged.

## Content model

Keep room content data-driven. A room should eventually be describable with structured data for:

- title and thesis;
- wall essays;
- artifacts;
- metadata;
- positions / orientation;
- optional interaction behavior.

This keeps art direction separate from the reusable museum engine.

## Prototype constraints

This version deliberately avoids:

- physics-heavy collisions;
- mobile controls;
- CMS integration;
- complex shaders;
- post-processing;
- audio;
- asset pipelines and GLTF models.

Those should only be introduced after the spatial concept is proven.
