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

## Current prototype

Room 01: **The Button**

Goal: validate scale, navigation, wall-reading distance and the idea of presenting UI components as physical museum artifacts.

Do not over-polish this room before testing it in the browser. The next useful step should be driven by what feels wrong during actual exploration.
