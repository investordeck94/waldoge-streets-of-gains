# Engine Core (`@/game/engine`)

The deterministic foundation. Anything in here must be safe to run in a
headless Node test, a Web Worker, or a future 3D scene with no changes.

## Rules

1. **No React.** No hooks, no components, no `useState`.
2. **No DOM / browser APIs.** No `window`, `document`, `navigator`,
   `localStorage`, `requestAnimationFrame`, `Audio`, `Image`.
3. **No canvas.** No `CanvasRenderingContext2D`, no draw calls.
4. **No gameplay state ownership.** Functions take inputs, return outputs.
   They never mutate a global store or emit side effects.
5. **Determinism.** Given the same inputs, always return the same outputs.
   Never call `Math.random()` — accept a seeded RNG as an argument if
   randomness is needed.
6. **No import from `@/game/logic` or `@/game/presentation`.** The
   dependency arrow points *into* the engine, never out.

## What lives here

- `core/` — types, AABB math, camera math, physics integration, animation
  timing helpers.
- `config/` — tunables (physics constants, level tables, difficulty).
- `vec.ts` — 2D/3D vector helpers.

## Import shape

New code should import from the barrel:

```ts
import { aabbOverlap, GRAVITY, computeCameraX, vec2 } from "@/game/engine";
```

Deep imports (`@/game/core/aabb`, `@/game/config/player`) still work but are
considered legacy — they will not be removed until every consumer is on the
barrel.
