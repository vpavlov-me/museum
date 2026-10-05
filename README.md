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

### Controls

- `W A S D` — move
- Mouse — look
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
