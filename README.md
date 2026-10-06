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

## Prototype 04 — Interface States

Room 03 makes the interface's state the state of the room itself. After the feed, a low, dark
passage with one turn resets the visitor before a new chapter:

```
02 → passage (low, dark, one turn) → 03 INTERFACE STATES
     prologue   the title and thesis, warm and even
     I   LOADING   placeholder walls, bench, light and text; stalls at 93%, then 99%; a waist-high
                   placeholder holds the door until the room has loaded
     II  EMPTY     the largest, barest volume: one wall, one line, one tiny primary action
     III ERROR     built wrongly: a wall slab plugs the exit, the rhythm is broken, the copy is cut off;
                   E — RETRY twice
     IV  OFFLINE   entering cuts the line and the light; emergency marks remain; E — RECONNECT
     V   SUCCESS   tall, bright and quiet: DONE., and a closed passage to Room 04
```

- `E` is used only for RETRY and RECONNECT; loading, the power cut and every lighting change follow
  the visitor's position. LOADING loads again on every visit; ERROR and OFFLINE stay fixed once fixed,
  so the room can always be walked backwards.
- **Room activation.** Each space is `active` (visitor inside), `nearby` (opens into it) or `inactive`,
  derived from the doors (`NEIGHBOURS`). Inactive rooms hide their contents (`RoomContents`) and pause
  their animations (`useRoomFrame`); architecture is never hidden, so nothing pops in at a doorway.
- **Light budget.** `Downlight` is now a fixture; one `LightRig` owns six spotlights and hands them to
  the fixtures that can be seen, nearest first, cross-fading. The number of lights never changes, so
  walking between rooms never recompiles shaders.
- The HUD names the current state under the room (`03 / INTERFACE STATES` · `III / ERROR`).

## Prototype 05 — Identity & exhibition shell

The three rooms now read as one exhibition, from the first load to the last door:

```
front door (loads, then opens) → ENTRANCE → 01 → 02 → 03 → colophon → EXIT → colophon page → visit again
```

- **Entry.** The 2D front door is also the loading state: until every room and its text are ready the
  button reads "Opening the rooms" (no percentage: none would be true), then "Enter exhibition".
- **Ending.** SUCCESS opens onto a small, warm colophon room in the entrance's palette (credits on the
  wall, an EXIT door). Leaving through it ends the visit with a 2D colophon; "Visit again" restarts at
  the entrance with every room back in its first state.
- **Identity.** `src/identity.ts` holds the name, credits, ink colours, typeface and signage type scale;
  `styles.css` mirrors them as custom properties. One typeface everywhere: Inter (OFL), subset and
  self-hosted in `public/fonts` and used by the 2D shell and every wall (`components/Text`). No text is
  fetched from a CDN any more.
- **Sharing.** Title, description, canonical, Open Graph / Twitter card (`public/og.png`), favicon,
  touch icon and `robots.txt`.

### Controls

- `W A S D` — move
- Mouse — look
- `E` — interact with the object in focus
- `Esc` — pause and release the cursor

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
3. **Interface States** — loading, empty, error, offline and success as spatial conditions (built in Prototype 04).
4. **Interfaces That Changed How We Design** — a subjective collection of influential products and patterns.

## Code structure

```
src/
  museum/      plan and shared state: room registry (bounds, cells, doors, zones, neighbours, spawn),
               types, store, room context and activation (RoomContents, useRoomFrame)
  scene/       MuseumWorld, Player, Controls, Collision, Interaction (focus + E), Lighting,
               materials (palettes), Light (Downlight, LightRig, LightPool, Luminaire), StaticMerge, geometry
  identity.ts  name, credits, ink, typeface and signage type scale (mirrored in styles.css)
  components/  Text (troika text in the museum's typeface), RoomShell, Wall, WallText, ChapterMark, Plinth,
               ExhibitLabel
  rooms/       entrance/, the-button/, passage/, accepted/, states/, colophon/ — each owns its composition
               and content
  ui/          Entry (front door and loading), HUD, ExhibitCard, Pause, ColophonScreen
```

Rooms are authored in local coordinates and placed at their registry `origin`. They register
obstacles with `useObstacle` and focus targets with `useFocusTarget`; walkable floor and which
spaces can see each other are derived from the registry, so adding a room means adding a registry
entry, its doors and its component. Put everything but merged architecture in `RoomContents`,
animate with `useRoomFrame`, and light exhibits with `Downlight` fixtures.
A room may be several rectangular cells with their own ceiling heights (Room 02 is five, Room 03
six); the taller neighbour builds a shared wall, unless both build half of it (`split`) so each face
can have its own palette. Architecture uses palette materials so it can be merged.

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
