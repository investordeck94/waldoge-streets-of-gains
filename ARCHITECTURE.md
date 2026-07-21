# Waldoge: Streets of Gains — Architecture

This document maps the current 2D brawler architecture and calls out the seams
where a future 3D evolution can slot in without a full rewrite.

## Current stack

- **Rendering**: single HTML5 `<canvas>` 2D context, DPR-aware, drawn from a
  `requestAnimationFrame` loop inside `src/components/StreetBrawler.tsx`.
- **Physics**: hand-rolled AABB + gravity, jump-through platforms, fixed
  timestep at ~60fps.
- **Entities**: flat `Entity` records (player, grunts, boss) with an
  `AttackState` enum acting as the animation/behavior state machine.
- **Combat**: `src/lib/fightMoves.ts` defines chained moves; `src/lib/fightStyles.ts`
  defines the Q-swappable style modifiers (Brawler / Bull Run / Anti Rug /
  Green Candle). Both are pure data and safe to reuse in a 3D port.
- **Audio**: `src/lib/gameSfx.ts` WebAudio bank plus streamed music tracks.
- **Input**: keyboard listeners + on-screen touch buttons; input buffer feeds
  the combo/chain system.
- **Environment**: 3-layer parallax backgrounds, per-level `Platform`
  layouts, rain/puddle particle systems, camera with predictive look-ahead.

## Modules that already isolate the pure game logic

The following files are engine-agnostic (no DOM or canvas dependency) and can
be reused directly in a 3D port:

- `src/lib/fightMoves.ts` — move timings, chains, damage tables
- `src/lib/fightStyles.ts` — style multipliers and cycle order
- `src/lib/gameSfx.ts` — SFX bank (WebAudio, works everywhere)

## Systems that will need a 3D counterpart

| 2D system (current)                                       | Planned 3D equivalent              |
| --------------------------------------------------------- | ---------------------------------- |
| `<canvas>` 2D draw calls in `StreetBrawler.tsx`           | `@react-three/fiber` scene         |
| `drawStickFigure` procedural Waldoge skin                 | Rigged glTF character + skin swap  |
| Parallax layers (`bg1/bg2/bg3`)                           | Skybox + instanced set dressing    |
| AABB collision + jump-through platforms                   | Capsule collider + navmesh floors  |
| Predictive 2D camera                                      | Third-person camera rig            |
| Rain/puddle/splash particle arrays                        | GPU particle system                |
| HUD overlays (React + canvas text)                        | React overlay only (unchanged)     |

## Rules for changes to `StreetBrawler.tsx`

1. Do not alter gameplay, controls, physics constants, AI, or animations
   without an explicit request. This file is preparation-only right now.
2. New systems should be added as sibling modules under `src/lib/` and
   consumed from the game loop; do not fork the loop.
3. Types belonging to shared systems (moves, styles, SFX) live next to those
   systems, not in the component file.
4. Do not rename exported symbols (`STYLES`, `MOVE_SETS`, etc.) — the MCP
   tools and other panels reference them by name.

## Known technical debt (leave for a future, scoped pass)

- `StreetBrawler.tsx` is >5k lines; extraction should be done system-by-system
  behind feature flags with visual regression checks, not in a single PR.
- Boss head `<Image>` instances are created at module scope; moving them into
  a preload pass will need care so first-frame draws still find them ready.
- Several `any`-shaped inline objects in the render path could be typed, but
  only where TypeScript inference already agrees — do not add casts that
  change runtime behavior.
